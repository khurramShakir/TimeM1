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

// Ensure the user exists in our local DB, if not create them
async function ensureUserExists(clerkId: string) {
    let user = await db.user.findUnique({
        where: { id: clerkId } as any
    });

    if (!user) {
        user = await db.user.create({
            data: {
                id: clerkId,
                email: `${clerkId}@example.com`,
            }
        });

        const startOfWeek = getStartOfWeek(new Date());

        await db.budgetPeriod.create({
            data: {
                userId: clerkId,
                startDate: startOfWeek,
                type: "WEEKLY",
                envelopes: {
                    create: [
                        { name: "Work", budgeted: 40, color: "blue" },
                        { name: "Sleep", budgeted: 56, color: "purple" },
                        { name: "Leisure", budgeted: 20, color: "green" },
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

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
}

// Fetch the budget period for a specific date (or current if omitted)
export async function getBudgetPeriodByDate(date: Date, clerkId?: string) {
    const userId = clerkId || await getAuthenticatedUser();
    await ensureUserExists(userId);

    const startOfWeek = getStartOfWeek(date);

    const period = await db.budgetPeriod.findFirst({
        where: {
            userId: userId as any,
            type: "WEEKLY",
            startDate: startOfWeek
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
export async function getCurrentBudgetPeriod(clerkId?: string) {
    return getBudgetPeriodByDate(new Date(), clerkId);
}

export async function initNewWeek(targetDate: Date) {
    const userId = await getAuthenticatedUser();
    const startOfTargetWeek = getStartOfWeek(targetDate);

    // Check if period already exists
    const existing = await db.budgetPeriod.findFirst({
        where: { userId: userId as any, startDate: startOfTargetWeek }
    });
    if (existing) return existing;

    // Find the latest previous period to clone categories from
    const latestPeriod = await db.budgetPeriod.findFirst({
        where: { userId: userId as any },
        orderBy: { startDate: "desc" },
        include: { envelopes: true }
    }) as any;

    const newPeriod = await db.budgetPeriod.create({
        data: {
            userId: userId as any,
            startDate: startOfTargetWeek,
            type: "WEEKLY",
            envelopes: {
                create: latestPeriod?.envelopes.map((env: any) => ({
                    name: env.name,
                    budgeted: env.budgeted,
                    color: env.color
                })) || [
                        { name: "Work", budgeted: 40, color: "blue" },
                        { name: "Sleep", budgeted: 56, color: "purple" },
                        { name: "Leisure", budgeted: 20, color: "green" },
                    ]
            }
        }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");
    return newPeriod;
}

// Calculate totals for a period given a date
export async function getBudgetSummary(targetDateInput?: string | Date) {
    const userId = await getAuthenticatedUser();
    const date = targetDateInput ? new Date(targetDateInput) : new Date();
    const period = await getBudgetPeriodByDate(date, userId) as any;

    if (!period) return { period: null, envelopes: [], totalBudgeted: 0, totalSpent: 0, totalRemaining: 168 };

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
    const totalRemaining = 168 - totalSpent;

    return {
        period,
        envelopes,
        totalBudgeted,
        totalSpent,
        totalRemaining,
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
    const period = await getBudgetPeriodByDate(targetDate, userId);
    if (!period) throw new Error("No active budget period found for this date");

    await db.envelope.create({
        data: {
            periodId: period.id,
            name,
            budgeted,
            color
        }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");
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

export async function getTransactions() {
    const userId = await getAuthenticatedUser();
    const transactions = await db.transaction.findMany({
        where: {
            envelope: {
                period: {
                    userId: userId as any,
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
