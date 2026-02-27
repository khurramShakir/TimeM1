import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient({})

async function main() {
    console.log('Start seeding ...')

    // 1. Create a Test User
    const user = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            id: 'user_2xyz_test', // Mock Clerk ID
            email: 'alice@example.com',
            name: 'Alice',
        },
    })
    console.log(`Created user with id: ${user.id}`)

    // 2. Create a Budget Period (Current Week)
    // Calculate Monday of the current week
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)

    const period = await prisma.budgetPeriod.upsert({
        where: {
            userId_startDate_type_domain: {
                userId: user.id,
                startDate: monday,
                type: 'WEEKLY',
                domain: 'TIME',
            },
        },
        update: {},
        create: {
            userId: user.id,
            startDate: monday,
            type: 'WEEKLY',
            domain: 'TIME',
            isClosed: false,
        },
    })
    console.log(`Created period with id: ${period.id}`)

    // 3. Create Envelopes
    const envelopesData = [
        { name: 'Work', budgeted: 40.0, color: 'blue' },
        { name: 'Sleep', budgeted: 56.0, color: 'purple' },
        { name: 'Leisure', budgeted: 20.0, color: 'green' },
        { name: 'Unallocated', budgeted: 52.0, color: 'gray' },
    ]

    for (const env of envelopesData) {
        await prisma.envelope.create({
            data: {
                name: env.name,
                budgeted: env.budgeted,
                color: env.color,
                periodId: period.id,
            },
        })
    }
    console.log('Created envelopes')

    // 4. Add a dummy transaction
    // Find the 'Work' envelope we just created (or found)
    const workEnvelope = await prisma.envelope.findFirst({
        where: { periodId: period.id, name: 'Work' },
    })

    if (workEnvelope) {
        await prisma.transaction.create({
            data: {
                amount: 2.5,
                description: 'Monday Morning Deep Work',
                date: new Date(),
                envelopeId: workEnvelope.id,
            },
        })
        console.log('Created transaction')
    }

    // 5. Create System User and Built-in Templates
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

    const defaultTemplates: Prisma.BudgetTemplateCreateInput[] = [
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
            user: { connect: { id: systemUserId } }
        },
        {
            name: 'Zero-Based Budget',
            domain: 'MONEY',
            isBuiltIn: true,
            defaultFundingMode: 'RESET',
            items: {
                create: [
                    { envelopeName: 'Housing', amount: 0, fundingModeOverride: 'RESET' },
                    { envelopeName: 'Food', amount: 0, fundingModeOverride: 'RESET' },
                    { envelopeName: 'Transportation', amount: 0, fundingModeOverride: 'RESET' },
                    { envelopeName: 'Utilities', amount: 0, fundingModeOverride: 'RESET' },
                    { envelopeName: 'Savings', amount: 0, fundingModeOverride: 'RESET' },
                ],
            },
            user: { connect: { id: systemUserId } }
        },
        {
            name: 'Start from Scratch',
            domain: 'MONEY',
            isBuiltIn: true,
            defaultFundingMode: 'ADD',
            items: {
                create: [],
            },
            user: { connect: { id: systemUserId } }
        },
        {
            name: 'Standard Time Block',
            domain: 'TIME',
            isBuiltIn: true,
            defaultFundingMode: 'ADD',
            items: {
                create: [
                    { envelopeName: 'Sleep', amount: 56, fundingModeOverride: 'INHERIT' },
                    { envelopeName: 'Work', amount: 40, fundingModeOverride: 'INHERIT' },
                    { envelopeName: 'Personal Care', amount: 14, fundingModeOverride: 'INHERIT' },
                    { envelopeName: 'Leisure', amount: 20, fundingModeOverride: 'INHERIT' },
                ],
            },
            user: { connect: { id: systemUserId } }
        }
    ]

    for (const tpl of defaultTemplates) {
        const existing = await prisma.budgetTemplate.findFirst({
            where: { name: tpl.name, userId: systemUserId }
        })

        if (!existing) {
            await prisma.budgetTemplate.create({
                data: {
                    name: tpl.name,
                    domain: tpl.domain,
                    isBuiltIn: tpl.isBuiltIn,
                    defaultFundingMode: tpl.defaultFundingMode,
                    user: { connect: { id: systemUserId } },
                    items: tpl.items
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
