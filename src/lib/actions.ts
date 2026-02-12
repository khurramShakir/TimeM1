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
                timeCapacity: 168,
                baseMoneyCapacity: 0,
                autoBudget: true
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
            // Use initNewPeriod to benefit from cloning and rollover logic
            await initNewPeriod(startOfP, d.name, d.period);
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
        await ensureUserExists(userId);
        settings = await (db as any).userSettings.findUnique({
            where: { userId },
            include: { user: true }
        });
    }

    if (!settings) throw new Error("Could not find or create user settings");

    return {
        id: settings.id,
        userId: settings.userId,
        currency: settings.currency,
        weekStart: settings.weekStart,
        defaultDomain: settings.defaultDomain,
        defaultPeriod: settings.defaultPeriod,
        timeCapacity: Number(settings.timeCapacity),
        baseMoneyCapacity: Number(settings.baseMoneyCapacity || 0),
        autoBudget: settings.autoBudget,
        updatedAt: settings.updatedAt,
        user: {
            id: settings.user.id,
            email: settings.user.email,
            name: settings.user.name
        }
    };
}

export async function updateUserSettings(data: {
    currency?: string;
    weekStart?: number;
    defaultDomain?: string;
    defaultPeriod?: string;
    timeCapacity?: number;
    baseMoneyCapacity?: number;
    autoBudget?: boolean;
}) {
    const userId = await getAuthenticatedUser();

    // Sanitize Data Types for Prisma
    const cleanData: any = {};
    if (data.currency) cleanData.currency = data.currency;
    if (data.weekStart !== undefined) cleanData.weekStart = Number(data.weekStart);
    if (data.defaultDomain) cleanData.defaultDomain = data.defaultDomain;
    if (data.defaultPeriod) cleanData.defaultPeriod = data.defaultPeriod;
    if (data.timeCapacity !== undefined) cleanData.timeCapacity = Math.round(Number(data.timeCapacity)); // Int
    if (data.baseMoneyCapacity !== undefined) cleanData.baseMoneyCapacity = Number(data.baseMoneyCapacity); // Float
    if (data.autoBudget !== undefined) cleanData.autoBudget = Boolean(data.autoBudget);

    await (db as any).userSettings.upsert({
        where: { userId },
        create: {
            userId,
            ...cleanData
        },
        update: cleanData
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

    // Calculate unallocated budgeted (capacity - sum of other budgeted)
    const totalBudgeted = period.envelopes
        .filter(e => e.name !== "Unallocated")
        .reduce((sum, e) => sum + Number(e.budgeted), 0);
    const unallocatedBudget = Number(period.capacity) - totalBudgeted;

    // Calculate unallocated funded (capacity - sum of other funded)
    const totalFunded = period.envelopes
        .filter(e => e.name !== "Unallocated")
        .reduce((sum, e) => sum + Number(e.funded), 0);
    const unallocatedFunded = Number(period.capacity) - totalFunded;

    const unallocatedEnv = period.envelopes.find(e => e.name === "Unallocated");

    if (unallocatedEnv) {
        await db.envelope.update({
            where: { id: unallocatedEnv.id },
            data: {
                budgeted: unallocatedBudget,
                funded: unallocatedFunded
            }
        });
    } else {
        // Create new Unallocated envelope with both budgeted and funded
        await db.envelope.create({
            data: {
                periodId: period.id,
                name: "Unallocated",
                budgeted: unallocatedBudget,
                funded: unallocatedFunded,
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


export async function addIncome(periodId: number, amount: number) {
    const userId = await getAuthenticatedUser();
    const period = await db.budgetPeriod.findUnique({
        where: { id: periodId },
        include: { envelopes: true }
    });

    if (!period || (period.userId as any) !== userId) throw new Error("Unauthorized");

    // 1. Update Period Capacity
    await db.budgetPeriod.update({
        where: { id: periodId },
        data: { capacity: { increment: amount } }
    });

    // 2. Sync Unallocated budgeted amount
    await syncUnallocated(periodId);

    // 3. Update Unallocated funded amount (actual money deposited)
    const unallocatedEnv = await db.envelope.findFirst({
        where: { periodId, name: "Unallocated" }
    });
    if (unallocatedEnv) {
        await db.envelope.update({
            where: { id: unallocatedEnv.id },
            data: { funded: { increment: amount } }
        });
    }

    // 4. Create Audit Transaction (Log)
    const unallocated = period.envelopes.find(e => e.name === "Unallocated")
        || unallocatedEnv;

    if (unallocated) {
        await db.transaction.create({
            data: {
                envelopeId: unallocated.id,
                amount: amount,
                type: "INCOME",
                description: `💰 Income Added`,
                date: new Date()
            } as any
        });
    }

    const domain = period.domain.toLowerCase();
    revalidatePath(`/dashboard/${domain}`);
}

interface CreateTransactionParams {
    envelopeId: number;
    toEnvelopeId?: number; // For TRANSFERS
    type?: string;         // EXPENSE, INCOME, TRANSFER
    amount: number;
    description?: string;
    entity?: string;       // Payee/Payer
    refNumber?: string;    // Check #
    date: Date;
    startTime?: Date;
    endTime?: Date;
}

export async function createTransaction(params: CreateTransactionParams) {
    const userId = await getAuthenticatedUser();
    const { envelopeId, toEnvelopeId, type = "EXPENSE", amount, description, entity, refNumber, date, startTime, endTime } = params;

    if (amount <= 0) {
        throw new Error("Amount must be positive");
    }

    // Verify primary envelope belongs to user
    const envelope = await db.envelope.findUnique({
        where: { id: envelopeId },
        include: { period: true }
    });

    if (!envelope || (envelope.period.userId as any) !== userId) {
        throw new Error("Unauthorized");
    }

    // Logic for different transaction types
    await db.$transaction(async (tx) => {
        // 1. Create the transaction record
        await tx.transaction.create({
            data: {
                envelopeId,
                toEnvelopeId,
                type,
                amount,
                description,
                entity,
                refNumber,
                date,
                startTime: startTime || null,
                endTime: endTime || null,
            } as any,
        });

        // 2. Adjust Funded balances if it's a TRANSFER or INCOME (since Fill Envelopes might already do this, we need care)
        // Note: Generic LogTimeModal transactions usually just record Spent.
        // But if type is TRANSFER, we must move funded capacity.
        if (type === "TRANSFER" && toEnvelopeId) {
            await tx.envelope.update({
                where: { id: envelopeId },
                data: { funded: { decrement: amount } }
            });
            await tx.envelope.update({
                where: { id: toEnvelopeId },
                data: { funded: { increment: amount } }
            });
        }

        // If it's an INCOME recorded via the general modal, we update the envelope's funded amount
        if (type === "INCOME") {
            await tx.envelope.update({
                where: { id: envelopeId },
                data: { funded: { increment: amount } }
            });

            // If it's to a specific envelope, we might also need to update period capacity 
            // but addIncome already handles that. This is for the manual "Log" flow.
        }
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

    let capacity = 0;
    if (domain === "TIME") {
        capacity = Number(settings.timeCapacity);
    } else {
        // MONEY Domain: Use Base Income Setting
        capacity = Number(settings.baseMoneyCapacity || 0);
    }

    // Determine Envelope Cloning Strategy & Rollover
    let envelopesToCreate = [];
    const shouldCopy = settings.autoBudget !== false; // Default to true

    let totalRollover = 0;

    if (latestPeriod && shouldCopy) {
        // Clone previous envelopes AND their budget amounts + rollover unspent funds
        envelopesToCreate = latestPeriod.envelopes
            .filter((env: any) => env.name !== "Unallocated")
            .map((env: any) => {
                // Calculate remaining balance from previous period
                const spent = (env.transactions || [])
                    .filter((t: any) => t.type === "EXPENSE" || !t.type)
                    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

                const remaining = Number(env.funded) - spent;

                // For Money domain, we rollover the balance
                const funded = domain === "MONEY" ? remaining : env.budgeted;
                if (domain === "MONEY") totalRollover += remaining;

                return {
                    name: env.name,
                    budgeted: env.budgeted, // Copy target
                    funded: funded,         // Set rollover as start balance
                    color: env.color
                };
            });

        // Also rollover Unallocated balance
        const prevUnallocated = latestPeriod.envelopes.find((e: any) => e.name === "Unallocated");
        if (prevUnallocated && domain === "MONEY") {
            const unSpent = Number(prevUnallocated.funded); // Unallocated doesn't have expenses usually, just transfers
            totalRollover += unSpent;
        }

    } else if (latestPeriod && !shouldCopy) {
        // Clone NAMES only, set budget to 0 (Zero-Based Budgeting)
        envelopesToCreate = latestPeriod.envelopes
            .filter((env: any) => env.name !== "Unallocated")
            .map((env: any) => ({
                name: env.name,
                budgeted: 0, // Reset to 0
                funded: 0,
                color: env.color
            }));
    } else {
        // Fresh Start (No previous period)
        envelopesToCreate = domain === "TIME" ? [
            { name: "Work", budgeted: 40, funded: 40, color: "blue" },
            { name: "Sleep", budgeted: 56, funded: 56, color: "purple" },
            { name: "Leisure", budgeted: 20, funded: 20, color: "green" },
        ] : [
            { name: "Rent", budgeted: 0, funded: 0, color: "blue" },
            { name: "Groceries", budgeted: 0, funded: 0, color: "green" },
            { name: "Entertainment", budgeted: 0, funded: 0, color: "purple" },
        ];
    }

    // New Period Capacity = Base Income + Rollover Surplus
    const finalCapacity = capacity + totalRollover;

    const newPeriod = await db.budgetPeriod.create({
        data: {
            userId: userId as any,
            startDate: startOfTargetPeriod,
            type: type,
            domain: domain,
            capacity: finalCapacity,
            envelopes: {
                create: envelopesToCreate
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
        // Only sum up EXPENSE transactions for "Spent"
        const spent = (env.transactions as any[])
            .filter((t: any) => t.type === "EXPENSE" || !t.type) // Default to expense if null
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        const budgeted = Number(env.budgeted);
        let funded = Number(env.funded);

        // For TIME domain, budget and funded are the same concept (capacity)
        if (domain === "TIME") {
            funded = budgeted;
        }

        // Balance = funded - spent (what's left to spend from actual deposits)
        const remaining = funded - spent;

        return {
            id: env.id,
            name: env.name,
            budgeted,
            funded,
            spent,
            remaining,
            color: env.color || "gray",
            periodId: env.periodId,
            transactions: (env.transactions as any[]).map(t => ({
                id: t.id,
                amount: Number(t.amount),
                type: t.type,
                description: t.description,
                date: t.date,
                entity: t.entity,
                refNumber: t.refNumber
            }))
        };
    });

    const totalBudgeted = envelopes.reduce((sum: number, e: any) => sum + e.budgeted, 0);
    const totalSpent = envelopes.reduce((sum: number, e: any) => sum + e.spent, 0);
    // For TIME, remaining is total physical hours minus spent
    // For MONEY, remaining is total budgeted minus spent
    const totalRemaining = domain === "TIME" ? availableHoursInPeriod - totalSpent : totalBudgeted - totalSpent;

    const totalFunded = envelopes.reduce((sum: number, e: any) => sum + e.funded, 0);

    return {
        period: {
            id: period.id,
            capacity: Number(period.capacity)
        },
        envelopes,
        totalBudgeted,
        totalFunded,
        totalSpent,
        totalRemaining,
        totalAvailable: availableHoursInPeriod,
        periodType,
        currency: settings.currency,
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

    // 1. Perform Transfer - move FUNDED (actual money), not budgeted (target)
    await db.$transaction([
        db.envelope.update({
            where: { id: fromId },
            data: { funded: { decrement: amount } },
        }),
        db.envelope.update({
            where: { id: toId },
            data: { funded: { increment: amount } },
        }),
    ]);

    // 2. Fetch envelope names for Audit Log
    const fromEnv = await db.envelope.findUnique({ where: { id: fromId } });
    const toEnv = await db.envelope.findUnique({ where: { id: toId } });

    // 3. Create Audit Transactions (Amount 0)
    // 3. Create Audit Transactions (Real Amount, Type TRANSFER)
    if (fromEnv && toEnv) {
        // Log on Source
        await db.transaction.create({
            data: {
                envelopeId: fromId,
                amount: amount,
                type: "TRANSFER",
                description: `Transferred to ${toEnv.name}`,
                date: new Date()
            } as any
        });
        // Log on Destination
        await db.transaction.create({
            data: {
                envelopeId: toId,
                amount: amount,
                type: "TRANSFER",
                description: `Received from ${fromEnv.name}`,
                date: new Date()
            } as any
        });
    }

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

    // For TIME domain: funded = budgeted (time is always "fully funded")
    // For MONEY domain: funded = 0 (must explicitly fund via Fill Envelopes)
    const funded = domain === "TIME" ? budgeted : 0;

    await db.envelope.create({
        data: {
            periodId: period.id,
            name,
            budgeted,
            funded,
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

    // For TIME domain: sync funded = budgeted when budget changes
    const domain = env.period.domain;
    const updateData: any = { ...data };
    if (domain === "TIME" && data.budgeted !== undefined) {
        updateData.funded = data.budgeted;
    }

    const updatedEnv = await db.envelope.update({
        where: { id },
        data: updateData,
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

export async function getTransactions(domain: string = "TIME", limit?: number) {
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
        take: limit,
        include: {
            envelope: true,
        },
    });

    return transactions.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        date: t.date,
        entity: t.entity,
        refNumber: t.refNumber,
        envelopeId: t.envelopeId,
        envelope: t.envelope ? {
            id: t.envelope.id,
            name: t.envelope.name,
            color: t.envelope.color,
            budgeted: Number(t.envelope.budgeted),
            funded: Number(t.envelope.funded)
        } : null
    }));
}

export async function updateTransaction(id: number, data: {
    envelopeId?: number;
    toEnvelopeId?: number;
    type?: string;
    amount?: number;
    description?: string;
    entity?: string;
    refNumber?: string;
    date?: Date;
    startTime?: Date;
    endTime?: Date;
}) {
    if (data.amount !== undefined && data.amount <= 0) {
        throw new Error("Amount must be positive");
    }

    // Basic update for now. 
    // Complex balance corrections for type changes or amount changes 
    // in TRANSFER/INCOME could be added later if needed.
    const transaction = await db.transaction.update({
        where: { id },
        data: {
            envelopeId: data.envelopeId,
            toEnvelopeId: data.toEnvelopeId,
            type: data.type,
            amount: data.amount,
            description: data.description,
            entity: data.entity,
            refNumber: data.refNumber,
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

/**
 * Fetch unique entities (Payees/Payers) for autocomplete
 */
export async function getRecentEntities(type: string, domain: string) {
    const userId = await getAuthenticatedUser();

    const transactions = await db.transaction.findMany({
        where: {
            type,
            envelope: {
                period: {
                    userId,
                    domain
                }
            },
            entity: { not: null }
        },
        select: { entity: true },
        distinct: ['entity'],
        take: 15,
        orderBy: { createdAt: 'desc' }
    });

    return transactions.map(t => t.entity as string);
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

// --- HUD Data Logic ---

export async function getUnifiedHudData(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    // Parallel fetch for both domains using the master summary function
    const [timeSummary, moneySummary] = await Promise.all([
        getBudgetSummary(targetDate, "TIME", "WEEKLY"),
        getBudgetSummary(targetDate, "MONEY", "MONTHLY")
    ]);

    // Extract Time Metrics
    const timeUnallocated = timeSummary.envelopes.find(e => e.name === "Unallocated");
    const timeLiquid = timeUnallocated ? timeUnallocated.budgeted : 0;

    // Extract Money Metrics
    const moneyUnallocated = moneySummary.envelopes.find(e => e.name === "Unallocated");
    const moneyLiquid = moneyUnallocated ? moneyUnallocated.funded : 0;

    const currencyPrefix = moneySummary.currency === "USD" ? "$" : moneySummary.currency;

    return {
        time: {
            liquid: timeLiquid,
            total: timeSummary.totalAvailable,
            budgeted: timeSummary.totalBudgeted,
            funded: timeSummary.totalFunded,
            spent: timeSummary.totalSpent,
            unit: "h"
        },
        money: {
            liquid: moneyLiquid,
            total: moneySummary.period?.capacity || 0,
            budgeted: moneySummary.totalBudgeted,
            funded: moneySummary.totalFunded,
            spent: moneySummary.totalSpent,
            unallocatedFunds: moneyLiquid,
            unit: "",
            prefix: currencyPrefix
        }
    };
}
