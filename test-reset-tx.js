const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const periodId = 13; // March 2026
    const period = await prisma.budgetPeriod.findUnique({
        where: { id: periodId },
        include: { envelopes: { include: { transactions: true } } }
    });

    const template = await prisma.budgetTemplate.findFirst({
        where: { domain: period.domain, isActive: true },
        include: { items: true }
    });
    const desiredEnvelopeNames = template.items.map(i => i.envelopeName);

    try {
        await prisma.$transaction(async (tx) => {
            const unallocatedEnv = period.envelopes.find(e => e.name === "Unallocated");
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
        console.log("Transaction succeeded");
    } catch (e) {
        console.error("TRANSACTION FAILED:", e);
    }
}

main().finally(() => prisma.$disconnect());
