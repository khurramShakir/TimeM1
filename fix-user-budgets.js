const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const template = await prisma.budgetTemplate.findFirst({
        where: { name: 'Montly Expanses', isActive: true },
        include: { items: true }
    });

    if (!template) return console.log("No active template found");

    const openPeriods = await prisma.budgetPeriod.findMany({
        where: {
            userId: template.userId,
            domain: template.domain,
            isClosed: false
        },
        include: { envelopes: true }
    });

    for (const period of openPeriods) {
        for (const item of template.items) {
            const existingEnvelope = period.envelopes.find(e => e.name === item.envelopeName);
            if (existingEnvelope) {
                await prisma.envelope.update({
                    where: { id: existingEnvelope.id },
                    data: { budgeted: item.amount }
                });
                console.log(`Updated ${existingEnvelope.name} to budget ${item.amount} in period ${period.startDate}`);
            }
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
