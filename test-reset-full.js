const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting reset test...");

    // Hardcoded known values from the DB read earlier
    const userId = "user_2stLwZtUvWwKkH62vJkKkYtJwYp";
    // We know period 11 is 'MONTHLY' 'MONEY'
    const periodId = 11;

    console.log("Finding period...");
    const period = await prisma.budgetPeriod.findUnique({
        where: { id: periodId, userId },
        include: { envelopes: { include: { transactions: true } } }
    });

    if (!period) throw new Error("Period not found");

    console.log("Finding Active Template for domain:", period.domain);
    const template = await prisma.budgetTemplate.findFirst({
        where: { userId, domain: period.domain, isActive: true },
        include: { items: true }
    });

    if (!template) throw new Error("Cannot reset without an Active Template.");
    console.log("Active template found:", template.name);

    console.log("Starting transaction...");
    const desiredEnvelopeNames = template.items.map(i => i.envelopeName);

    try {
        await prisma.$transaction(async (tx) => {
            const unallocatedEnv = period.envelopes.find(e => e.name === "Unallocated");
            if (!unallocatedEnv) throw new Error("Unallocated envelope missing");

            let totalSwept = 0;

            for (const env of period.envelopes) {
                if (env.name === "Unallocated") continue;

                const spent = env.transactions
                    .filter(t => t.type === "EXPENSE" || !t.type)
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                const remaining = Number(env.funded) - spent;

                if (remaining > 0) {
                    await tx.transaction.create({
                        data: {
                            envelopeId: env.id,
                            toEnvelopeId: unallocatedEnv.id,
                            type: "TRANSFER",
                            amount: remaining,
                            description: `🔄 Budget Reset Sweep`,
                            date: new Date(),
                            isSystemAdjustment: true
                        }
                    });

                    await tx.envelope.update({
                        where: { id: env.id },
                        data: { funded: { decrement: remaining } }
                    });

                    totalSwept += remaining;
                } else if (remaining < 0) {
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
                        }
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

            for (const env of period.envelopes) {
                if (env.name === "Unallocated") continue;

                const hasSpending = env.transactions.some(t => (t.type === "EXPENSE" || !t.type));

                if (!hasSpending && !desiredEnvelopeNames.includes(env.name)) {
                    await tx.transaction.deleteMany({
                        where: { OR: [{ envelopeId: env.id }, { toEnvelopeId: env.id }] }
                    });
                    await tx.envelope.delete({ where: { id: env.id } });
                }
            }
        });
        console.log("Prisma transaction succeeded!");
    } catch (e) {
        console.error("Prisma transaction failed:", e);
    }
}

main().finally(() => prisma.$disconnect());
