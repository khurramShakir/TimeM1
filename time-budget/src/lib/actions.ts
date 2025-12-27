"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

interface CreateTransactionParams {
    envelopeId: number;
    amount: number;
    description: string;
    date: Date;
    startTime?: Date;
    endTime?: Date;
}

export async function createTransaction(params: CreateTransactionParams) {
    const { envelopeId, amount, description, date, startTime, endTime } = params;

    if (amount <= 0) {
        throw new Error("Amount must be positive");
    }

    await db.transaction.create({
        data: {
            envelopeId,
            amount,
            description,
            date,
            startTime: startTime || null,
            endTime: endTime || null,
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
}

// Fetch the current active budget period for a user
export async function getCurrentBudgetPeriod(userId: number) {
    // Logic to find the current week's period
    // For MVP, we just grab the first open one or the latest one
    const period = await db.budgetPeriod.findFirst({
        where: {
            userId: userId,
            type: "WEEKLY",
        },
        orderBy: {
            startDate: "desc",
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

// Calculate totals for a period
export async function getBudgetSummary(userId: number) {
    const period = await getCurrentBudgetPeriod(userId);

    if (!period) return null;

    // Calculate totals
    const envelopes = period.envelopes.map((env) => {
        const spent = env.transactions.reduce(
            (sum, t) => sum + Number(t.amount),
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

    const totalBudgeted = envelopes.reduce((sum, e) => sum + e.budgeted, 0);
    const totalSpent = envelopes.reduce((sum, e) => sum + e.spent, 0);
    const totalRemaining = 168 - totalSpent; // Hardcoded 168 for now based on weekly logic

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
    const envelope = await db.envelope.findUnique({
        where: { id: envelopeId },
        include: {
            transactions: {
                orderBy: { date: "desc" },
            },
        },
    });

    if (!envelope) return null;

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
}

// --- Envelope Management CRUD ---

interface CreateEnvelopeParams {
    userId: number;
    name: string;
    budgeted: number;
    color: string;
}

export async function createEnvelope(params: CreateEnvelopeParams) {
    const { userId, name, budgeted, color } = params;

    // Find active period
    const period = await getCurrentBudgetPeriod(userId);
    if (!period) throw new Error("No active budget period found");

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

export async function getTransactions(userId: number) {
    const transactions = await db.transaction.findMany({
        where: {
            envelope: {
                period: {
                    userId: userId,
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
