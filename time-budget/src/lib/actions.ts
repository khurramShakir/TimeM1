"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

async function getAuthenticatedUser() {
    const authObj = await auth();
    const userId = authObj.userId;
    if (!userId) {
        throw new Error("Unauthorized");
    }
    return userId;
}

function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday is 0
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
}

function getStartOfMonth(date: Date) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
}

function getStartOfPeriod(date: Date, type: string) {
    if (type === "MONTHLY") return getStartOfMonth(date);
    return getStartOfWeek(date);
}

// Ensure the user exists in our local DB, if not create them
async function ensureUserExists(clerkId: string, domain: string = "TIME", periodType: string = "WEEKLY") {
    let user = await db.user.findUnique({
        where: { id: clerkId } as any
    });

    if (!user) {
        user = await db.user.create({
            data: {
                id: clerkId,
                email: `${clerkId}@clerk.user`,
            }
        });
    }

    // Now ensure the domain-specific period exists
    const startOfPeriod = getStartOfPeriod(new Date(), periodType);
    const existingPeriod = await db.budgetPeriod.findFirst({
        where: { userId: clerkId, startDate: startOfPeriod, domain: domain, type: periodType }
    });

    if (!existingPeriod) {
        await db.budgetPeriod.create({
            data: {
                userId: clerkId,
                startDate: startOfPeriod,
                type: periodType,
                domain: domain,
                envelopes: {
                    create: domain === "TIME" ? [
                        { name: "Work", budgeted: 40, color: "blue" },
                        { name: "Sleep", budgeted: 56, color: "purple" },
                        { name: "Leisure", budgeted: 20, color: "green" },
                    ] : [
                        { name: "Rent", budgeted: 1500, color: "blue" },
                        { name: "Groceries", budgeted: 400, color: "green" },
                        { name: "Entertainment", budgeted: 100, color: "purple" },
                    ]
                }
            } as any
        });
    }

    return clerkId;
}

interface CreateTransactionParams {
    envelopeId: number;
    amount: number;
    description: string;
    date: Date;
    startTime?: Date;
    endTime?: Date;
}

export async function createTransaction(params: CreateTransactionParams) {
    const userId = await getAuthenticatedUser();
    const { envelopeId, amount, description, date, startTime, endTime } = params;

    if (amount <= 0) {
        throw new Error("Amount must be positive");
    }

    // Verify envelope belongs to user
    const envelope = await db.envelope.findUnique({
        where: { id: envelopeId },
        include: { period: true }
    });

    if (!envelope || (envelope.period.userId as any) !== userId) {
        throw new Error("Unauthorized");
    }

    await db.transaction.create({
        data: {
            envelopeId,
            amount,
            description,
            date,
            startTime: startTime || null,
            endTime: endTime || null,
        } as any,
    });

    revalidatePath(`/dashboard/${envelope.period.domain.toLowerCase()}`);
    revalidatePath(`/dashboard/${envelope.period.domain.toLowerCase()}/transactions`);
}

// Fetch the budget period for a specific date (or current if omitted)
export async function getBudgetPeriodByDate(date: Date, clerkId?: string, domain: string = "TIME", periodType: string = "WEEKLY") {
    const userId = clerkId || await getAuthenticatedUser();
    await ensureUserExists(userId, domain, periodType);

    const startOfPeriod = getStartOfPeriod(date, periodType);

    const period = await db.budgetPeriod.findFirst({
        where: {
            userId: userId as any,
            type: periodType,
            startDate: startOfPeriod,
            domain: domain
        },
        include: {
            envelopes: {
                include: {
                    transactions: true,
                },
            },
        },
    });

    return period;
}

// Deprecated or redirect to getBudgetPeriodByDate for compatibility
export async function getCurrentBudgetPeriod(domain: string = "TIME", clerkId?: string) {
    return getBudgetPeriodByDate(new Date(), clerkId, domain, "WEEKLY");
}

export async function initNewPeriod(targetDate: Date, domain: string = "MONEY", type: string = "WEEKLY") {
    const userId = await getAuthenticatedUser();
    const startOfTargetPeriod = getStartOfPeriod(targetDate, type);

    // Check if period already exists
    const existing = await db.budgetPeriod.findFirst({
        where: { userId: userId as any, startDate: startOfTargetPeriod, domain: domain, type: type }
    });
    if (existing) return existing;

    // Find the latest previous period of SAME TYPE to clone categories from
    const latestPeriod = await db.budgetPeriod.findFirst({
        where: { userId: userId as any, domain: domain, type: type },
        orderBy: { startDate: "desc" },
        include: { envelopes: true }
    }) as any;

    const newPeriod = await db.budgetPeriod.create({
        data: {
            userId: userId as any,
            startDate: startOfTargetPeriod,
            type: type,
            domain: domain,
            envelopes: {
                create: latestPeriod?.envelopes.map((env: any) => ({
                    name: env.name,
                    budgeted: env.budgeted,
                    color: env.color
                })) || (domain === "TIME" ? [
                    { name: "Work", budgeted: 40, color: "blue" },
                    { name: "Sleep", budgeted: 56, color: "purple" },
                    { name: "Leisure", budgeted: 20, color: "green" },
                ] : [
                    { name: "Rent", budgeted: 1500, color: "blue" },
                    { name: "Groceries", budgeted: 400, color: "green" },
                    { name: "Entertainment", budgeted: 100, color: "purple" },
                ])
            }
        }
    });

    const path = `/dashboard/${domain.toLowerCase()}`;
    revalidatePath(path);
    revalidatePath(`${path}/budget`);
    return newPeriod;
}

// For backward compatibility until all pages are updated
export async function initNewWeek(targetDate: Date, domain: string = "MONEY") {
    return initNewPeriod(targetDate, domain, "WEEKLY");
}

// Calculate totals for a period given a date
export async function getBudgetSummary(targetDateInput?: string | Date, domain: string = "TIME", periodType: string = "WEEKLY") {
    const userId = await getAuthenticatedUser();
    const date = targetDateInput ? new Date(targetDateInput) : new Date();
    const period = await getBudgetPeriodByDate(date, userId, domain, periodType) as any;

    function getHoursInPeriod(targetDate: Date, type: string) {
        if (type === "WEEKLY") return 168; // 24 * 7
        if (type === "MONTHLY") {
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            return daysInMonth * 24;
        }
        return 0;
    }

    const availableHoursInPeriod = getHoursInPeriod(date, periodType);

    if (!period) return {
        period: null,
        envelopes: [],
        totalBudgeted: 0,
        totalSpent: 0,
        totalRemaining: domain === "TIME" ? availableHoursInPeriod : 0,
        periodType
    };

    // Calculate totals
    const envelopes = (period.envelopes as any[]).map((env: any) => {
        const spent = (env.transactions as any[]).reduce(
            (sum: number, t: any) => sum + Number(t.amount),
            0
        );
        const budgeted = Number(env.budgeted);
        const remaining = budgeted - spent;

        return {
            ...env,
            budgeted,
            spent,
            remaining,
        };
    });

    const totalBudgeted = envelopes.reduce((sum: number, e: any) => sum + e.budgeted, 0);
    const totalSpent = envelopes.reduce((sum: number, e: any) => sum + e.spent, 0);
    // For TIME, remaining is total physical hours minus spent
    // For MONEY, remaining is total budgeted minus spent
    const totalRemaining = domain === "TIME" ? availableHoursInPeriod - totalSpent : totalBudgeted - totalSpent;

    return {
        period,
        envelopes,
        totalBudgeted,
        totalSpent,
        totalRemaining,
        totalAvailable: availableHoursInPeriod,
        periodType
    };
}

// Fetch details for a specific envelope including transactions
export async function getEnvelopeDetails(envelopeId: number) {
    const userId = await getAuthenticatedUser();
    const envelope = await db.envelope.findUnique({
        where: { id: envelopeId },
        include: {
            period: true,
            transactions: {
                orderBy: { date: "desc" },
            },
        },
    });

    if (!envelope || (envelope.period.userId as any) !== userId) return null;

    // Calculate totals
    const spent = envelope.transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
    );
    const budgeted = Number(envelope.budgeted);
    const remaining = budgeted - spent;

    return {
        ...envelope,
        budgeted,
        spent,
        remaining,
        domain: envelope.period.domain
    };
}


export async function transferBudget(fromId: number, toId: number, amount: number) {
    if (amount <= 0) throw new Error("Amount must be positive");
    if (fromId === toId) throw new Error("Cannot transfer to same envelope");

    await db.$transaction([
        db.envelope.update({
            where: { id: fromId },
            data: { budgeted: { decrement: amount } },
        }),
        db.envelope.update({
            where: { id: toId },
            data: { budgeted: { increment: amount } },
        }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");
}

// --- Envelope Management CRUD ---

interface CreateEnvelopeParams {
    name: string;
    budgeted: number;
    color: string;
    date?: string | Date; // Added date to target specific weeks
}

export async function createEnvelope(params: CreateEnvelopeParams) {
    const userId = await getAuthenticatedUser();
    const { name, budgeted, color, date } = params;

    const targetDate = date ? new Date(date) : new Date();
    // Default to TIME if not specified? 
    // Actually createEnvelope should probably know the domain.
    // For now we'll infer it from the period we find, but we should probably pass it.
    const period = await getBudgetPeriodByDate(targetDate, userId);
    if (!period) throw new Error("No active budget period found");

    await db.envelope.create({
        data: {
            periodId: period.id,
            name,
            budgeted,
            color
        }
    });

    const path = `/dashboard/${period.domain.toLowerCase()}`;
    revalidatePath(path);
    revalidatePath(`${path}/budget`);
}

export async function updateEnvelope(id: number, data: { name?: string; budgeted?: number; color?: string }) {
    await db.envelope.update({
        where: { id },
        data
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");
}

export async function deleteEnvelope(id: number) {
    // Check for transactions first? For MVP allow delete but maybe we should cascade/warn.
    // Ideally we should move transactions to "Unallocated" or delete them.
    // For now, let's assume we can delete.

    await db.envelope.delete({
        where: { id }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");
}

export async function getTransactions(domain: string = "TIME") {
    const userId = await getAuthenticatedUser();
    const transactions = await db.transaction.findMany({
        where: {
            envelope: {
                period: {
                    userId: userId as any,
                    domain: domain
                },
            },
        },
        orderBy: {
            date: 'desc',
        },
        include: {
            envelope: true,
        },
    });

    return transactions;
}

export async function updateTransaction(id: number, data: {
    envelopeId?: number;
    amount?: number;
    description?: string;
    date?: Date;
    startTime?: Date;
    endTime?: Date;
}) {
    if (data.amount !== undefined && data.amount <= 0) {
        throw new Error("Amount must be positive");
    }

    await db.transaction.update({
        where: { id },
        data: {
            envelopeId: data.envelopeId,
            amount: data.amount,
            description: data.description,
            date: data.date,
            startTime: data.startTime || null,
            endTime: data.endTime || null,
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
}

export async function deleteTransaction(id: number) {
    await db.transaction.delete({
        where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
}
