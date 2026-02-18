const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- 🧪 Verifying Transfer Logic Feasibility ---");

    // 1. Get or Create a User and Period
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log("Creating test user...");
        user = await prisma.user.create({ data: { id: "test_verifier", email: "test@test.com" } });
    }

    // Find a TIME period
    let period = await prisma.budgetPeriod.findFirst({
        where: { userId: user.id, domain: "TIME" },
        include: { envelopes: true }
    });

    if (!period) {
        console.log("Creating test TIME period...");
        // Simplify creation for test
        period = await prisma.budgetPeriod.create({
            data: {
                userId: user.id,
                startDate: new Date(),
                type: "WEEKLY",
                domain: "TIME",
                capacity: 168,
                envelopes: {
                    create: [
                        { name: "Work", budgeted: 40, color: "blue" },
                        { name: "Sleep", budgeted: 56, color: "purple" },
                        { name: "Unallocated", budgeted: 72, color: "gray" } // 168 - 96 = 72
                    ]
                }
            },
            include: { envelopes: true }
        });
    }

    const workEnv = period.envelopes.find(e => e.name === "Work");
    const uncEnv = period.envelopes.find(e => e.name === "Unallocated");

    if (!workEnv || !uncEnv) {
        console.error("❌ Critical envelopes missing.");
        return;
    }

    console.log(`\n📊 Initial State:`);
    console.log(`   Work: ${workEnv.budgeted}h`);
    console.log(`   Unallocated: ${uncEnv.budgeted}h`);
    console.log(`   Total: ${Number(workEnv.budgeted) + Number(uncEnv.budgeted)}h (Partial Sum)`);

    // 2. Simulate Transfer: 10h from Unallocated -> Work
    // Effectively: "Allocating 10h of free time to Work"
    console.log(`\n🔄 Executing Transfer: 10h from Unallocated -> Work`);

    // DB Transaction mimicking actions.ts
    const [updatedUnc, updatedWork] = await prisma.$transaction([
        prisma.envelope.update({
            where: { id: uncEnv.id },
            data: { budgeted: { decrement: 10 } }
        }),
        prisma.envelope.update({
            where: { id: workEnv.id },
            data: { budgeted: { increment: 10 } }
        })
    ]);

    console.log(`\n📊 Post-Transfer State:`);
    console.log(`   Work: ${updatedWork.budgeted}h`);
    console.log(`   Unallocated: ${updatedUnc.budgeted}h`);
    console.log(`   Total: ${Number(updatedWork.budgeted) + Number(updatedUnc.budgeted)}h`);

    // 3. Verify Logic
    const expectedUnc = Number(uncEnv.budgeted) - 10;
    const expectedWork = Number(workEnv.budgeted) + 10;

    if (Number(updatedUnc.budgeted) === expectedUnc && Number(updatedWork.budgeted) === expectedWork) {
        console.log("\n✅ SUCCESS: Database updated correctly.");

        // 4. Feasibility Check
        console.log("\n🤔 Feasibility Check:");
        if (Number(updatedUnc.budgeted) < 0) {
            console.log("   ⚠️ Unallocated is NEGATIVE. This indicates Overbooking.");
        } else {
            console.log("   👍 Unallocated is positive. Valid allocation.");
        }
        console.log("   Transfer mechanism works for TIME domain.");
    } else {
        console.error("\n❌ FAILURE: Math mismatch.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
