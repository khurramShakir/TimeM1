"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { syncUnallocated } from "./actions";

async function getAuthenticatedUser() {
    const authObj = await auth();
    const userId = authObj.userId;
    if (!userId) {
        throw new Error("Unauthorized");
    }
    return userId;
}

// --- Template Management ---

export async function getBudgetTemplates(domain: string = "MONEY") {
    const userId = await getAuthenticatedUser();
    const templates = await (db as any).budgetTemplate.findMany({
        where: { userId, domain },
        include: { items: true },
        orderBy: { createdAt: "desc" }
    });

    // Convert Prisma Decimal to number for Client Component compatibility
    return templates.map((t: any) => ({
        ...t,
        items: t.items.map((i: any) => ({
            ...i,
            amount: Number(i.amount)
        }))
    }));
}

export async function upsertBudgetTemplate(data: {
    id?: string;
    name: string;
    domain: string;
    isAutoFillEnabled?: boolean;
    defaultFundingMode?: "ADD" | "RESET";
    items: {
        envelopeName: string;
        amount: number;
        fundingModeOverride?: "ADD" | "RESET" | "INHERIT";
    }[];
}) {
    const userId = await getAuthenticatedUser();

    if (data.id) {
        // Update existing
        await (db as any).$transaction(async (tx: any) => {
            await tx.budgetTemplate.update({
                where: { id: data.id, userId },
                data: {
                    name: data.name,
                    domain: data.domain,
                    isAutoFillEnabled: data.isAutoFillEnabled ?? false,
                    defaultFundingMode: data.defaultFundingMode ?? "ADD",
                    items: {
                        deleteMany: {},
                        create: data.items.map(item => ({
                            envelopeName: item.envelopeName,
                            amount: item.amount,
                            fundingModeOverride: item.fundingModeOverride ?? "INHERIT"
                        }))
                    }
                }
            });
        });
    } else {
        // Create new
        await (db as any).budgetTemplate.create({
            data: {
                userId,
                name: data.name,
                domain: data.domain,
                isAutoFillEnabled: data.isAutoFillEnabled ?? false,
                defaultFundingMode: data.defaultFundingMode ?? "ADD",
                items: {
                    create: data.items.map(item => ({
                        envelopeName: item.envelopeName,
                        amount: item.amount,
                        fundingModeOverride: item.fundingModeOverride ?? "INHERIT"
                    }))
                }
            }
        });
    }

    revalidatePath("/dashboard/settings");
}

export async function deleteBudgetTemplate(id: string) {
    const userId = await getAuthenticatedUser();
    await (db as any).budgetTemplate.delete({
        where: { id, userId }
    });
    revalidatePath("/dashboard/settings");
}

// --- Execution Logic ---

export async function executeBudgetTemplate(templateId: string, periodId: number) {
    const userId = await getAuthenticatedUser();

    const template = await (db as any).budgetTemplate.findUnique({
        where: { id: templateId, userId },
        include: { items: true }
    });

    if (!template) throw new Error("Template not found");

    const period = await db.budgetPeriod.findUnique({
        where: { id: periodId, userId },
        include: { envelopes: true }
    });

    if (!period) throw new Error("Period not found");

    await db.$transaction(async (tx) => {
        const envelopes = period.envelopes;
        const unallocatedEnv = envelopes.find(e => e.name === "Unallocated");
        if (!unallocatedEnv) throw new Error("Unallocated envelope not found");

        const operations = template.items.map((item: any) => {
            const env = envelopes.find(e => e.name === item.envelopeName);
            if (!env) return null;

            const mode = item.fundingModeOverride === "INHERIT" || !item.fundingModeOverride
                ? template.defaultFundingMode
                : item.fundingModeOverride;

            let delta = 0;
            if (mode === "ADD") {
                delta = Number(item.amount);
            } else {
                // RESET mode: delta = target - current
                delta = Number(item.amount) - Number(env.funded);
            }

            return { envelopeId: env.id, envelopeName: env.name, delta };
        }).filter((op: any) => op !== null && op.delta !== 0) as { envelopeId: number; envelopeName: string; delta: number; }[];

        // Step 1: Execute sweeps (negative delta) first to maximize Unallocated
        const sweeps = operations.filter(op => op.delta < 0);
        const pulls = operations.filter(op => op.delta > 0);

        // Current Unallocated balance (tracking within transaction)
        let currentUnallocated = Number(unallocatedEnv.funded);

        for (const op of sweeps as any[]) {
            const amount = Math.abs(op.delta);
            // Move from Envelope back to Unallocated
            await tx.envelope.update({
                where: { id: op.envelopeId },
                data: { funded: { decrement: amount } }
            });
            await tx.envelope.update({
                where: { id: unallocatedEnv.id },
                data: { funded: { increment: amount } }
            });

            await tx.transaction.create({
                data: {
                    envelopeId: op.envelopeId,
                    toEnvelopeId: unallocatedEnv.id,
                    type: "TRANSFER",
                    amount: amount,
                    description: `🔄 Template Sweep: ${template.name}`,
                    date: new Date(),
                    isSystemAdjustment: false
                } as any
            });

            currentUnallocated += amount;
        }

        // Step 2: Execute pulls (positive delta)
        for (const op of pulls) {
            if (currentUnallocated < op.delta) {
                throw new Error(`Insufficient funds in Unallocated to fund ${op.envelopeName}. Needed ${op.delta}, available ${currentUnallocated}.`);
            }

            // Move from Unallocated to Envelope
            await tx.envelope.update({
                where: { id: unallocatedEnv.id },
                data: { funded: { decrement: op.delta } }
            });
            await tx.envelope.update({
                where: { id: op.envelopeId },
                data: { funded: { increment: op.delta } }
            });

            await tx.transaction.create({
                data: {
                    envelopeId: unallocatedEnv.id,
                    toEnvelopeId: op.envelopeId,
                    type: "TRANSFER",
                    amount: op.delta,
                    description: `✨ Template Fill: ${template.name}`,
                    date: new Date(),
                    isSystemAdjustment: false
                } as any
            });

            currentUnallocated -= op.delta;
        }
    });

    revalidatePath("/dashboard/money", 'layout');
    revalidatePath("/dashboard/time", 'layout');
    revalidatePath("/dashboard/settings");
}

// --- Reconciliation (Clean Slate) ---

export async function cleanSlate(periodId: number, actualBalance: number, clearDebt: boolean) {
    const userId = await getAuthenticatedUser();

    const period = await db.budgetPeriod.findUnique({
        where: { id: periodId, userId },
        include: { envelopes: true }
    });

    if (!period) throw new Error("Period not found");

    await db.$transaction(async (tx) => {
        const envelopes = period.envelopes;
        const unallocatedEnv = envelopes.find(e => e.name === "Unallocated");
        if (!unallocatedEnv) throw new Error("Unallocated envelope not found");

        let currentUnallocated = Number(unallocatedEnv.funded);

        // Step 1: Clear negative envelopes
        if (clearDebt) {
            const negatives = envelopes.filter(e => Number(e.funded) < 0);
            for (const env of negatives) {
                const debt = Math.abs(Number(env.funded));

                // Move from Unallocated to clear debt
                await tx.envelope.update({
                    where: { id: env.id },
                    data: { funded: 0 }
                });
                await tx.envelope.update({
                    where: { id: unallocatedEnv.id },
                    data: { funded: { decrement: debt } }
                });

                await tx.transaction.create({
                    data: {
                        envelopeId: unallocatedEnv.id,
                        toEnvelopeId: env.id,
                        type: "TRANSFER",
                        amount: debt,
                        description: `🧹 Clean Slate: Debt Cleared`,
                        date: new Date(),
                        isSystemAdjustment: true
                    } as any
                });

                currentUnallocated -= debt;
            }
        }

        // Step 2: Reconcile Unallocated to reality
        const delta = actualBalance - currentUnallocated;

        if (delta !== 0) {
            await tx.envelope.update({
                where: { id: unallocatedEnv.id },
                data: { funded: actualBalance }
            });

            // Adjust period capacity so math still works
            await tx.budgetPeriod.update({
                where: { id: periodId },
                data: { capacity: { increment: delta } }
            });

            await tx.transaction.create({
                data: {
                    envelopeId: unallocatedEnv.id,
                    amount: Math.abs(delta),
                    type: delta > 0 ? "INCOME" : "EXPENSE",
                    description: `⚖️ System Adjustment: Clean Slate`,
                    date: new Date(),
                    isSystemAdjustment: true
                } as any
            });
        }
    });

    revalidatePath("/dashboard/money", 'layout');
    revalidatePath("/dashboard/reports", 'layout');
}
