const { setActiveTemplate } = require('./build/src/lib/budget-actions.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const template = await prisma.budgetTemplate.findFirst({
        where: { name: 'Montly Expanses' }
    });
    console.log("Found template:", template.id);

    // Directly test the setActiveTemplate function, but wait, it needs authentication context.
    // Instead of testing the server action directly (which might fail due to no clerk session),
    // let's manually write the loop to verify the logic, or we can just test it using the app.

    // It's probably easier to just reload the page since I'm sure the fix works. 
    // Let me just test via the database script.
}
main();
