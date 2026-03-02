const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const items = await prisma.envelope.findMany({ include: { period: true } });
    console.log(items.map(i => ({ name: i.name, domain: i.period.domain, isClosed: i.period.isClosed })));
}
main().finally(() => prisma.$disconnect());
