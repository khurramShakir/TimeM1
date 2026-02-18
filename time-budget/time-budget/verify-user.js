const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    const napTx = await prisma.transaction.findFirst({
        where: { description: { contains: 'Nap' } },
        include: {
            envelope: {
                include: {
                    period: true
                }
            }
        }
    });

    if (napTx) {
        console.log("Transaction ID:", napTx.id);
        console.log("Envelope:", napTx.envelope.name);
        console.log("Period User ID:", napTx.envelope.period.userId);

        if (napTx.envelope.period.userId !== 1) {
            console.error("❌ MISMATCH: App queries for User 1, but Transaction belongs to User", napTx.envelope.period.userId);
        } else {
            console.log("✅ User ID matches (1).");
        }
    } else {
        console.error("Transaction not found.");
    }
}

checkData()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
