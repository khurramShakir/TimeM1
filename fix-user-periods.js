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
        await prisma.budgetPeriod.update({
            where: { id: period.id },
            data: { templateId: template.id }
        });

        const existingEnvelopeNames = period.envelopes.map(e => e.name);
        const missingEnvelopes = template.items.filter(item => !existingEnvelopeNames.includes(item.envelopeName));

        for (const missing of missingEnvelopes) {
            console.log(`Adding ${missing.envelopeName} to period ${period.startDate}`);
            await prisma.envelope.create({
                data: {
                    name: missing.envelopeName,
                    budgeted: 0,
                    funded: 0,
                    color: "blue",
                    periodId: period.id
                }
            });
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
