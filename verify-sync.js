const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const template = await prisma.budgetTemplate.findFirst({
        where: { name: 'Sub-Agent Test Template' },
        include: { items: true }
    });
    console.log('Template Found:', !!template);
    if (template) {
        console.log('Template items count:', template.items.length);
    }

    const envs = await prisma.envelope.findMany({
        where: { name: 'Sub-Agent Test Envelope' }
    });
    console.log('Envelopes in DB matching name:', envs.length);
    if (envs.length > 0) {
        console.log('SYNC SUCCESS!');
    } else {
        console.log('SYNC FAILED!');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
