const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

async function checkDB() {
    console.log("--- DB CHECK ---");
    const napTx = await prisma.transaction.findFirst({
        where: { description: { contains: 'Nap' } },
        include: { envelope: true }
    });

    if (napTx) {
        console.log("✅ Found 'Nap' transaction in DB:", napTx.amount + "h", "on", napTx.date);
        return true;
    } else {
        console.error("❌ 'Nap' transaction NOT found in DB.");
        return false;
    }
}

function checkServer() {
    console.log("\n--- SERVER CHECK (http://localhost:3001/dashboard/transactions) ---");
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3001/dashboard/transactions', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (data.includes('Nap')) {
                    console.log("✅ Server response contains 'Nap'.");
                    resolve(true);
                } else {
                    console.error("❌ 'Nap' NOT found in server response.");
                    // console.log("Partial response preview:", data.substring(0, 500)); 
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.error("❌ Server request failed:", err.message);
            resolve(false);
        });
    });
}

async function main() {
    const dbOk = await checkDB();
    if (dbOk) {
        // Wait a moment for server to be potentially ready if just started, though it said ready.
        await checkServer();
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
