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

export async function getAllEnvelopeNames(domain: string = "MONEY") {
    const userId = await getAuthenticatedUser();
    const envelopes = await (db as any).envelope.findMany({
        where: {
            period: {
                userId,
                domain
            }
        },
        select: { name: true },
        distinct: ['name']
    });

    return envelopes
        .map((e: any) => e.name as string)
        .filter((name: string) => name !== "Unallocated")
        .sort();
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
        // Prevent modifying built-in templates directly
        const existing = await (db as any).budgetTemplate.findUnique({
            where: { id: data.id, userId }
        });
        if (existing?.isBuiltIn) {
            throw new Error("Cannot modify built-in templates directly. Please duplicate it first.");
        }

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

            if (existing?.isActive) {
                const openPeriods = await tx.budgetPeriod.findMany({
                    where: { userId, domain: data.domain, isClosed: false },
                    include: { envelopes: true }
                });

                for (const period of openPeriods) {
                    for (const item of data.items) {
                        const existingEnvelope = period.envelopes.find((e: any) => e.name === item.envelopeName);
                        if (existingEnvelope) {
                            await tx.envelope.update({
                                where: { id: existingEnvelope.id },
                                data: { budgeted: item.amount }
                            });
                        } else {
                            await tx.envelope.create({
                                data: {
                                    name: item.envelopeName,
                                    budgeted: item.amount,
                                    funded: 0,
                                    color: "blue",
                                    periodId: period.id
                                }
                            });
                        }
                    }
                }
            }
        });
    } else {
        // Create new
        await (db as any).budgetTemplate.create({
            data: {
                userId,
                name: data.name,
                domain: data.domain,
                isActive: false, // New templates are not active by default
                isBuiltIn: false, // User created templates are never built-in
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

export async function setActiveTemplate(templateId: string) {
    const userId = await getAuthenticatedUser();

    const template = await (db as any).budgetTemplate.findUnique({
        where: { id: templateId, userId },
        include: { items: true }
    });

    if (!template) throw new Error("Template not found");

    await (db as any).$transaction(async (tx: any) => {
        // 1. Deactivate all other templates in this domain
        await tx.budgetTemplate.updateMany({
            where: { userId, domain: template.domain },
            data: { isActive: false }
        });

        // 2. Activate the chosen template
        await tx.budgetTemplate.update({
            where: { id: templateId },
            data: { isActive: true }
        });

        // 3. Find ALL CURRENT, open budget periods for this domain
        // and update their template links so reporting stays in sync.
        const openPeriods = await tx.budgetPeriod.findMany({
            where: {
                userId,
                domain: template.domain,
                isClosed: false
            },
            include: { envelopes: true }
        });

        for (const period of openPeriods) {
            await tx.budgetPeriod.update({
                where: { id: period.id },
                data: { templateId: template.id }
            });

            // 4. Sync envelopes from the template into each period
            for (const item of template.items) {
                const existingEnvelope = period.envelopes.find((e: any) => e.name === item.envelopeName);
                if (existingEnvelope) {
                    await tx.envelope.update({
                        where: { id: existingEnvelope.id },
                        data: { budgeted: item.amount }
                    });
                } else {
                    await tx.envelope.create({
                        data: {
                            name: item.envelopeName,
                            budgeted: item.amount,
                            funded: 0,
                            color: "blue", // Default color
                            periodId: period.id
                        }
                    });
                }
            }
        }
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/" + template.domain.toLowerCase(), "layout");
}

export async function onboardUserTemplate(templateId: string) {
    const userId = await getAuthenticatedUser();

    // Find the requested template
    const sourceTemplate = await (db as any).budgetTemplate.findUnique({
        where: { id: templateId },
        include: { items: true }
    });

    if (!sourceTemplate) throw new Error("Template not found");

    if (!sourceTemplate.isBuiltIn && sourceTemplate.userId === userId) {
        // Just activate it if it's already their own template
        await setActiveTemplate(templateId);
        return;
    }

    if (!sourceTemplate.isBuiltIn) {
        throw new Error("Unauthorized");
    }

    // It is built-in; duplicate it to the user's account and set it active
    await (db as any).$transaction(async (tx: any) => {
        // Deactivate existing templates in domain
        await tx.budgetTemplate.updateMany({
            where: { userId, domain: sourceTemplate.domain },
            data: { isActive: false }
        });

        const newTemplate = await tx.budgetTemplate.create({
            data: {
                userId,
                name: sourceTemplate.name,
                domain: sourceTemplate.domain,
                isActive: true, // Make active immediately
                isBuiltIn: false,
                isAutoFillEnabled: sourceTemplate.isAutoFillEnabled,
                defaultFundingMode: sourceTemplate.defaultFundingMode,
                items: {
                    create: sourceTemplate.items.map((item: any) => ({
                        envelopeName: item.envelopeName,
                        amount: item.amount,
                        fundingModeOverride: item.fundingModeOverride
                    }))
                }
            }
        });

        // Link to ALL current open periods
        const openPeriods = await tx.budgetPeriod.findMany({
            where: {
                userId,
                domain: sourceTemplate.domain,
                isClosed: false
            },
            include: { envelopes: true }
        });

        for (const period of openPeriods) {
            await tx.budgetPeriod.update({
                where: { id: period.id },
                data: { templateId: newTemplate.id }
            });

            // Sync envelopes
            for (const item of sourceTemplate.items) {
                const existingEnvelope = period.envelopes.find((e: any) => e.name === item.envelopeName);
                if (existingEnvelope) {
                    await tx.envelope.update({
                        where: { id: existingEnvelope.id },
                        data: { budgeted: item.amount }
                    });
                } else {
                    await tx.envelope.create({
                        data: {
                            name: item.envelopeName,
                            budgeted: item.amount,
                            funded: 0,
                            color: "blue",
                            periodId: period.id
                        }
                    });
                }
            }
        }
    });

    revalidatePath("/dashboard", "layout");
}

export async function deleteBudgetTemplate(id: string) {
    const userId = await getAuthenticatedUser();
    await (db as any).budgetTemplate.delete({
        where: { id, userId }
    });
    revalidatePath("/dashboard/settings");
}

// --- Execution Logic ---

export async function executeBudgetTemplate(templateId: string, periodId: number, autoIncome: boolean = false) {
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

        const sweeps = operations.filter(op => op.delta < 0);
        const pulls = operations.filter(op => op.delta > 0);

        let currentUnallocated = Number(unallocatedEnv.funded);

        // Step 1: Execute sweeps (negative delta) first to maximize Unallocated
        for (const op of sweeps as any[]) {
            const amount = Math.abs(op.delta);
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
                    isSystemAdjustment: true
                } as any
            });

            currentUnallocated += amount;
        }

        // Step 1.5 Checking for deficit and injecting Auto Income
        const totalRequiredPulls = pulls.reduce((sum, op) => sum + op.delta, 0);
        const deficit = totalRequiredPulls - currentUnallocated;

        if (deficit > 0) {
            if (autoIncome) {
                // Auto Income injection
                await tx.envelope.update({
                    where: { id: unallocatedEnv.id },
                    data: { funded: { increment: deficit } }
                });

                // Adjust period capacity so reporting math still works
                await tx.budgetPeriod.update({
                    where: { id: periodId },
                    data: { capacity: { increment: deficit } }
                });

                await tx.transaction.create({
                    data: {
                        envelopeId: unallocatedEnv.id,
                        type: "INCOME",
                        amount: deficit,
                        description: "Auto Income",
                        date: new Date(),
                        isSystemAdjustment: false // Not system so it shows in reporting
                    } as any
                });

                currentUnallocated += deficit;
            }
            // If autoIncome is false, we just let Unallocated go negative during the pull loop as requested.
        }

        // Step 2: Execute pulls (positive delta)
        for (const op of pulls) {
            // Unallocated is guaranteed to be sufficient if autoIncome was used or deficit was <= 0
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
                    isSystemAdjustment: true
                } as any
            });

            currentUnallocated -= op.delta;
        }

        // Finally, stamp the BudgetPeriod with the template used
        await tx.budgetPeriod.update({
            where: { id: periodId },
            data: { templateId: template.id }
        });
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

export async function resetBudgetPeriodAction(periodId: number) {
    const userId = await getAuthenticatedUser();

    const period = await db.budgetPeriod.findUnique({
        where: { id: periodId, userId },
        include: { envelopes: { include: { transactions: true } } }
    });

    if (!period) throw new Error("Period not found");

    // Get Active Template
    const template = await (db as any).budgetTemplate.findFirst({
        where: { userId, domain: period.domain, isActive: true },
        include: { items: true }
    });

    if (!template) throw new Error("Cannot reset without an Active Template.");
    const desiredEnvelopeNames = template.items.map((i: any) => i.envelopeName);

    await db.$transaction(async (tx) => {
        const unallocatedEnv = period.envelopes.find((e: any) => e.name === "Unallocated");
        if (!unallocatedEnv) throw new Error("Unallocated envelope missing");

        let totalSwept = 0;

        // 1. Sweep unspent funds
        for (const env of period.envelopes) {
            if (env.name === "Unallocated") continue;

            const spent = env.transactions
                .filter((t: any) => t.type === "EXPENSE" || !t.type)
                .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

            const remaining = Number(env.funded) - spent;

            if (remaining > 0) {
                // Sweep back to unallocated
                await tx.transaction.create({
                    data: {
                        envelopeId: env.id,
                        toEnvelopeId: unallocatedEnv.id,
                        type: "TRANSFER",
                        amount: remaining,
                        description: `🔄 Budget Reset Sweep`,
                        date: new Date(),
                        isSystemAdjustment: true
                    } as any
                });

                await tx.envelope.update({
                    where: { id: env.id },
                    data: { funded: { decrement: remaining } }
                });

                totalSwept += remaining;
            } else if (remaining < 0) {
                // If they are overspent, we have to pull from unallocated to cover it so the envelope is at $0
                const deficit = Math.abs(remaining);
                await tx.transaction.create({
                    data: {
                        envelopeId: unallocatedEnv.id,
                        toEnvelopeId: env.id,
                        type: "TRANSFER",
                        amount: deficit,
                        description: `🔄 Budget Reset Sweep (Cover Overdraft)`,
                        date: new Date(),
                        isSystemAdjustment: true
                    } as any
                });

                await tx.envelope.update({
                    where: { id: env.id },
                    data: { funded: { increment: deficit } }
                });

                totalSwept -= deficit;
            }
        }

        if (totalSwept !== 0) {
            await tx.envelope.update({
                where: { id: unallocatedEnv.id },
                data: { funded: { increment: totalSwept } }
            });
        }

        // 2. Prune obsolete empty envelopes
        for (const env of period.envelopes) {
            if (env.name === "Unallocated") continue;

            // Re-calculate after sweeps. It should be 0 unless there's a serious sync issue.
            const hasSpending = env.transactions.some((t: any) => (t.type === "EXPENSE" || !t.type));

            if (!hasSpending && !desiredEnvelopeNames.includes(env.name)) {
                // Safe to delete! No spending history, no longer in template.
                // First delete its transactions (like the sweep we just made)
                await tx.transaction.deleteMany({
                    where: { OR: [{ envelopeId: env.id }, { toEnvelopeId: env.id }] }
                });
                // Then delete envelope
                await tx.envelope.delete({ where: { id: env.id } });
            }
        }
    });

    // 3. Execute Template Redistribution
    await executeBudgetTemplate(template.id, periodId, false);

    revalidatePath("/dashboard", 'layout');
}
