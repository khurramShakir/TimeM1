const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const periods = await prisma.budgetPeriod.findMany({
        where: {
            isClosed: false,
            startDate: { gt: new Date('2026-03-31') } // Delete periods after March
        }
    });

    for (let p of periods) {
        await prisma.budgetPeriod.delete({ where: { id: p.id } });
    }
    console.log('Cleaned future periods (April+) to allow fresh rollover testing');
}
main().catch(console.error).finally(() => prisma.$disconnect());
