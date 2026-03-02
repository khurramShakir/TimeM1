const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find all templates for this user to see if any are active
    const templates = await prisma.budgetTemplate.findMany({
        select: { id: true, name: true, domain: true, isActive: true }
    });

    console.log("Templates:", templates);

    // Find all periods
    const periods = await prisma.budgetPeriod.findMany({
        select: { id: true, type: true, domain: true, templateId: true }
    });
    console.log("Periods:", periods);

}

main().finally(() => prisma.$disconnect());
