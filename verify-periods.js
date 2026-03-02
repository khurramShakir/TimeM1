const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const periods = await prisma.budgetPeriod.findMany({
        where: { domain: 'MONEY' },
        include: { envelopes: true },
        orderBy: { startDate: 'desc' },
        take: 3
    });
    console.log(periods.map(p => ({
        id: p.id,
        date: p.startDate,
        type: p.type,
        envelopesCount: p.envelopes.length,
        envelopes: p.envelopes.map(e => e.name)
    })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
