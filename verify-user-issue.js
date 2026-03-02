const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const template = await prisma.budgetTemplate.findFirst({
        where: { name: 'Montly Expanses' },
        include: { items: true }
    });
    console.log('Template:', template);

    const activePeriod = await prisma.budgetPeriod.findFirst({
        where: { domain: 'MONEY' },
        orderBy: { startDate: 'desc' },
        include: { envelopes: true }
    });
    console.log('Current Money Period:', {
        id: activePeriod?.id,
        templateId: activePeriod?.templateId,
        envelopesCount: activePeriod?.envelopes.length,
        envelopes: activePeriod?.envelopes.map(e => ({ name: e.name, id: e.id, budgeted: e.budgeted }))
    });
}
main().finally(() => prisma.$disconnect());
