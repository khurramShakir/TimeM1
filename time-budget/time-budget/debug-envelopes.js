const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const envelopes = await prisma.envelope.findMany();
    console.log(envelopes);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
