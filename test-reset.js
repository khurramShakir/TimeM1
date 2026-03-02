const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// A script to mock the failure scenario to see the exact error
async function main() {
    // Get the first money period
    const period = await prisma.budgetPeriod.findFirst({
        where: { domain: "MONEY", isClosed: false },
        include: { envelopes: { include: { transactions: true } } }
    });

    if (!period) return console.log("No period found.");

    // See what envelopes we have
    console.log("Period Envelopes:", period.envelopes.map(e => e.name));

    // Check if there are any orphaned transactions preventing deletion
    const envIds = period.envelopes.map(e => e.id);
    const orphanedTx = await prisma.transaction.findMany({
        where: {
            OR: [
                { envelopeId: { in: envIds } },
                { toEnvelopeId: { in: envIds } }
            ]
        }
    });

    console.log(`Found ${orphanedTx.length} transactions physically attached to these envelopes.`);

    // If pruning logic is what fails, it's likely a Prisma Relation violation.
    // "Foreign key constraint failed on the field: `Envelope_periodId_fkey (index)`" etc. 
    // Let's actually execute the resetBudgetPeriodAction via node to see the stack trace.
}

main().catch(console.error).finally(() => prisma.$disconnect());
