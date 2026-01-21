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

export async function updateUserProfile(data: { name?: string }) {
    const userId = await getAuthenticatedUser();
    await db.user.update({
        where: { id: userId },
        data: { name: data.name }
    });
    revalidatePath("/dashboard/settings");
}

function getStartOfWeek(date: Date, weekStart: number = 0) {
    const d = new Date(date);
    const day = d.getDay();
    // Calculate difference, adjusting for weekStart (0 for Sun, 1 for Mon)
    let diff = d.getDate() - day + weekStart;
    if (day < weekStart) diff -= 7;

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

function getStartOfPeriod(date: Date, type: string, weekStart: number = 0) {
    if (type === "MONTHLY") return getStartOfMonth(date);
    return getStartOfWeek(date, weekStart);
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

    // Ensure settings exist
    let settings = await (db as any).userSettings.findUnique({
        where: { userId: clerkId }
    });

    if (!settings) {
        settings = await (db as any).userSettings.create({
            data: {
                userId: clerkId,
                currency: "USD",
                weekStart: 0,
                defaultDomain: "TIME",
                defaultPeriod: "WEEKLY",
                timeCapacity: 168
            }
        });
    }

    // Ensure BOTH domain-specific periods exist for the current time
    const domains = [
        { name: "TIME", period: "WEEKLY" },
        { name: "MONEY", period: "MONTHLY" }
    ];

    for (const d of domains) {
        const startOfP = getStartOfPeriod(new Date(), d.period, settings.weekStart);
        const existingP = await db.budgetPeriod.findFirst({
            where: { userId: clerkId, startDate: startOfP, domain: d.name, type: d.period }
        });

        if (!existingP) {
            const capacity = d.name === "TIME" ? Number(settings.timeCapacity) : 0;
            const period = await db.budgetPeriod.create({
                data: {
                    userId: clerkId,
                    startDate: startOfP,
                    type: d.period,
                    domain: d.name,
                    capacity: capacity,
                    envelopes: {
                        create: d.name === "TIME" ? [
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
            await syncUnallocated(period.id);
        }
    }

    return clerkId;
}

export async function getUserSettings() {
    const userId = await getAuthenticatedUser();
    let settings = await (db as any).userSettings.findUnique({
        where: { userId },
        include: { user: true }
    });

    if (!settings) {
        // Fallback or init if missing for some reason
        await ensureUserExists(userId);
        settings = await (db as any).userSettings.findUnique({
            where: { userId }
        });
    }

    return settings;
}

export async function updateUserSettings(data: {
    currency?: string;
    weekStart?: number;
    defaultDomain?: string;
    defaultPeriod?: string;
    timeCapacity?: number;
}) {
    const userId = await getAuthenticatedUser();

    await (db as any).userSettings.upsert({
        where: { userId },
        create: {
            userId,
            ...data
        },
        update: data
    });

    // If time capacity changed, we might want to sync current TIME periods
    // But for now, user settings are global "defaults". 
    // Usually capacity is set per-period now.

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
}

export async function syncUnallocated(periodId: number) {
    const period = await db.budgetPeriod.findUnique({
        where: { id: periodId },
        include: { envelopes: true }
    });
    if (!period) return;

    const totalBudgeted = period.envelopes
        .filter(e => e.name !== "Unallocated")
        .reduce((sum, e) => sum + Number(e.budgeted), 0);

    const unallocatedBudget = Number(period.capacity) - totalBudgeted;

    const unallocatedEnv = period.envelopes.find(e => e.name === "Unallocated");

    if (unallocatedEnv) {
        await db.envelope.update({
            where: { id: unallocatedEnv.id },
            data: { budgeted: unallocatedBudget }
        });
    } else {
        await db.envelope.create({
            data: {
                periodId: period.id,
                name: "Unallocated",
                budgeted: unallocatedBudget,
                color: "gray"
            }
        });
    }
}

export async function updatePeriodCapacity(periodId: number, capacity: number) {
    const userId = await getAuthenticatedUser();
    const period = await db.budgetPeriod.findUnique({ where: { id: periodId } });

    if (!period || (period.userId as any) !== userId) throw new Error("Unauthorized");

    await db.budgetPeriod.update({
        where: { id: periodId },
        data: { capacity }
    });

    await syncUnallocated(periodId);

    const domain = period.domain.toLowerCase();
    revalidatePath(`/dashboard/${domain}`);
    revalidatePath(`/dashboard/${domain}/budget`);
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

    const domain = envelope.period.domain.toLowerCase();
    revalidatePath(`/dashboard/${domain}`);
    revalidatePath(`/dashboard/${domain}/budget`);
    revalidatePath(`/dashboard/${domain}/transactions`);
}

// Fetch the budget period for a specific date (or current if omitted)
export async function getBudgetPeriodByDate(date: Date, clerkId?: string, domain: string = "TIME", periodType: string = "WEEKLY") {
    const userId = clerkId || await getAuthenticatedUser();
    await ensureUserExists(userId, domain, periodType);

    const settings = await getUserSettings();
    const startOfPeriod = getStartOfPeriod(date, periodType, settings.weekStart);

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
    const settings = await getUserSettings();
    const startOfTargetPeriod = getStartOfPeriod(targetDate, type, settings.weekStart);

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

    const capacity = latestPeriod ? Number(latestPeriod.capacity) : (domain === "TIME" ? Number(settings.timeCapacity) : 0);

    const newPeriod = await db.budgetPeriod.create({
        data: {
            userId: userId as any,
            startDate: startOfTargetPeriod,
            type: type,
            domain: domain,
            capacity: capacity,
            envelopes: {
                create: latestPeriod?.envelopes
                    .filter((env: any) => env.name !== "Unallocated")
                    .map((env: any) => ({
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

    await syncUnallocated(newPeriod.id);

    return newPeriod;
}

// For backward compatibility until all pages are updated
export async function initNewWeek(targetDate: Date, domain: string = "MONEY") {
    return initNewPeriod(targetDate, domain, "WEEKLY");
}

// Calculate totals for a period given a date
export async function getBudgetSummary(targetDateInput?: string | Date, domain: string = "TIME", periodType: string = "WEEKLY") {
    const userId = await getAuthenticatedUser();
    const settings = await getUserSettings();
    const date = targetDateInput ? new Date(targetDateInput) : new Date();
    const period = await getBudgetPeriodByDate(date, userId, domain, periodType) as any;

    function getHoursInPeriod(targetDate: Date, type: string) {
        if (period?.capacity && Number(period.capacity) > 0) return Number(period.capacity);

        if (type === "WEEKLY") return Number(settings.timeCapacity); // Use user setting
        if (type === "MONTHLY") {
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            // Scaling 168h week to month: (capacity / 7) * days
            return (Number(settings.timeCapacity) / 7) * daysInMonth;
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
    // Calculate totals and sanitize for Client Components (No Decimals)
    const envelopes = (period.envelopes as any[]).map((env: any) => {
        const spent = (env.transactions as any[]).reduce(
            (sum: number, t: any) => sum + Number(t.amount),
            0
        );
        const budgeted = Number(env.budgeted);
        const remaining = budgeted - spent;

        return {
            id: env.id,
            name: env.name,
            budgeted,
            spent,
            remaining,
            color: env.color || "gray",
            periodId: env.periodId,
            transactions: (env.transactions as any[]).map(t => ({
                ...t,
                amount: Number(t.amount)
            }))
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
        periodType,
        currency: settings.currency, // Pass currency to UI
        weekStart: settings.weekStart
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
    date?: string | Date;
    domain: string;
    type: string;
}

export async function createEnvelope(params: CreateEnvelopeParams) {
    const userId = await getAuthenticatedUser();
    const { name, budgeted, color, date, domain, type } = params;

    const targetDate = date ? new Date(date) : new Date();
    const period = await getBudgetPeriodByDate(targetDate, userId, domain, type);
    if (!period) throw new Error("No active budget period found");

    if (name === "Unallocated") throw new Error("Cannot create a category named Unallocated");

    await db.envelope.create({
        data: {
            periodId: period.id,
            name,
            budgeted,
            color
        }
    });

    await syncUnallocated(period.id);

    const path = `/dashboard/${domain.toLowerCase()}`;
    revalidatePath(path);
    revalidatePath(`${path}/budget`);
}

export async function updateEnvelope(id: number, data: { name?: string; budgeted?: number; color?: string }) {
    const env = await db.envelope.findUnique({ where: { id }, include: { period: true } });
    if (!env) return;

    if (env.name === "Unallocated" && data.name && data.name !== "Unallocated") {
        throw new Error("Cannot rename the Unallocated category");
    }

    const updatedEnv = await db.envelope.update({
        where: { id },
        data,
        include: { period: true }
    });

    await syncUnallocated(updatedEnv.periodId);

    const path = `/dashboard/${updatedEnv.period.domain.toLowerCase()}`;
    revalidatePath(path);
    revalidatePath(`${path}/budget`);
}

export async function deleteEnvelope(id: number) {
    const env = await db.envelope.findUnique({
        where: { id },
        include: { period: true }
    });

    if (!env) return;
    if (env.name === "Unallocated") throw new Error("Cannot delete the Unallocated category");

    await db.envelope.delete({
        where: { id }
    });

    await syncUnallocated(env.periodId);

    const path = `/dashboard/${env.period.domain.toLowerCase()}`;
    revalidatePath(path);
    revalidatePath(`${path}/budget`);
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

    const transaction = await db.transaction.update({
        where: { id },
        data: {
            envelopeId: data.envelopeId,
            amount: data.amount,
            description: data.description,
            date: data.date,
            startTime: data.startTime || null,
            endTime: data.endTime || null,
        },
        include: { envelope: { include: { period: true } } }
    });

    const domain = (transaction.envelope.period as any).domain.toLowerCase();
    revalidatePath(`/dashboard/${domain}`);
    revalidatePath(`/dashboard/${domain}/budget`);
    revalidatePath(`/dashboard/${domain}/transactions`);
}

export async function deleteTransaction(id: number) {
    const transaction = await db.transaction.delete({
        where: { id },
        include: { envelope: { include: { period: true } } }
    });

    const domain = (transaction.envelope.period as any).domain.toLowerCase();
    revalidatePath(`/dashboard/${domain}`);
    revalidatePath(`/dashboard/${domain}/budget`);
    revalidatePath(`/dashboard/${domain}/transactions`);
}
