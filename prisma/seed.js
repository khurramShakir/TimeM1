const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Starting seed: Built-in Templates...')

    // We need to ensure there's at least one user to own these, or we create a "System" user.
    // Given the current schema enforces userId on BudgetTemplate, we'll try to attach 
    // these to existing users, or handle it dynamically in the app.
    // Actually, a better approach for built-in templates that are globally available 
    // requires either a "system" user, or making userId optional. 
    // Let's check the schema: `userId String`. It is required.
    // This means built-in templates must be seeded PER USER, or we create a dummy "system" user.

    // Let's create a dedicated "system" user for built-in templates if it doesn't exist
    const systemUserId = 'system_template_owner_1'

    let systemUser = await prisma.user.findUnique({
        where: { id: systemUserId }
    })

    if (!systemUser) {
        systemUser = await prisma.user.create({
            data: {
                id: systemUserId,
                email: 'system@timem1.local',
                name: 'System Templates',
            }
        })
        console.log('Created System User for templates.')
    }

    const defaultTemplates = [
        {
            name: '50/30/20 Rule',
            domain: 'MONEY',
            isBuiltIn: true,
            defaultFundingMode: 'ADD',
            items: {
                create: [
                    { envelopeName: 'Needs (50%)', amount: 50, fundingModeOverride: 'INHERIT' },
                    { envelopeName: 'Wants (30%)', amount: 30, fundingModeOverride: 'INHERIT' },
                    { envelopeName: 'Savings (20%)', amount: 20, fundingModeOverride: 'INHERIT' },
                ],
            },
        },
        {
            name: 'Zero-Based Budget',
            domain: 'MONEY',
            isBuiltIn: true,
            defaultFundingMode: 'TARGET', // using TARGET (RESET in db enum)
            items: {
                create: [
                    { envelopeName: 'Housing', amount: 0, fundingModeOverride: 'RESET' },
                    { envelopeName: 'Food', amount: 0, fundingModeOverride: 'RESET' },
                    { envelopeName: 'Transportation', amount: 0, fundingModeOverride: 'RESET' },
                    { envelopeName: 'Utilities', amount: 0, fundingModeOverride: 'RESET' },
                    { envelopeName: 'Savings', amount: 0, fundingModeOverride: 'RESET' },
                ],
            },
        },
        {
            name: 'Standard Time Block',
            domain: 'TIME',
            isBuiltIn: true,
            defaultFundingMode: 'ADD',
            items: {
                create: [
                    { envelopeName: 'Sleep', amount: 56, fundingModeOverride: 'INHERIT' }, // 8h * 7
                    { envelopeName: 'Work', amount: 40, fundingModeOverride: 'INHERIT' },
                    { envelopeName: 'Personal Care', amount: 14, fundingModeOverride: 'INHERIT' },
                    { envelopeName: 'Leisure', amount: 20, fundingModeOverride: 'INHERIT' },
                ],
            },
        }
    ]

    for (const tpl of defaultTemplates) {
        // Check if it already exists to prevent duplicates on re-seed
        const existing = await prisma.budgetTemplate.findFirst({
            where: { name: tpl.name, isBuiltIn: true }
        })

        if (!existing) {
            await prisma.budgetTemplate.create({
                data: {
                    ...tpl,
                    userId: systemUserId
                }
            })
            console.log(`Seeded built-in template: ${tpl.name}`)
        } else {
            console.log(`Template already exists: ${tpl.name}`)
        }
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
