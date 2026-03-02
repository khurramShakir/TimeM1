const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const futureDate = new Date('2026-03-31');

    const periods = await prisma.budgetPeriod.findMany({
        where: {
            isClosed: false,
            startDate: { gt: futureDate }
        }
    });

    const periodIds = periods.map(p => p.id);

    if (periodIds.length === 0) {
        console.log('No future periods found to clean.');
        return;
    }

    console.log(`Found ${periodIds.length} future periods. Cleaning up...`);

    // Delete transactions connected to the envelopes of these periods
    const deletedTransactions = await prisma.transaction.deleteMany({
        where: {
            envelope: {
                periodId: { in: periodIds }
            }
        }
    });
    console.log(`Deleted ${deletedTransactions.count} transactions.`);

    // Delete envelopes
    const deletedEnvelopes = await prisma.envelope.deleteMany({
        where: {
            periodId: { in: periodIds }
        }
    });
    console.log(`Deleted ${deletedEnvelopes.count} envelopes.`);

    // Delete periods
    const deletedPeriods = await prisma.budgetPeriod.deleteMany({
        where: {
            id: { in: periodIds }
        }
    });
    console.log(`Deleted ${deletedPeriods.count} budget periods.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
