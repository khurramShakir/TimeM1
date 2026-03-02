const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Delete "Rent", "Groceries", "Housing", "Entertainment" from TIME periods
    const timeContaminants = ["Rent", "Groceries", "Housing", "Entertainment"];

    const deletedTime = await prisma.envelope.deleteMany({
        where: {
            name: { in: timeContaminants },
            period: {
                domain: "TIME"
            }
        }
    });
    console.log('Cleaned up contaminated TIME envelopes:', deletedTime.count);

    // Delete "Work", "Sleep", "Leisure", "Investment" from MONEY periods
    const moneyContaminants = ["Work", "Sleep", "Leisure", "Investment"];
    const deletedMoney = await prisma.envelope.deleteMany({
        where: {
            name: { in: moneyContaminants },
            period: {
                domain: "MONEY"
            }
        }
    });
    console.log('Cleaned up contaminated MONEY envelopes:', deletedMoney.count);
}
main().finally(() => prisma.$disconnect());
