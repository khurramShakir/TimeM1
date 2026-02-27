import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { OnboardingClient } from "./OnboardingClient";
import layoutStyles from "../layout.module.css";

export default async function OnboardingPage() {
    const authObj = await auth();
    const userId = authObj.userId;

    if (!userId) redirect("/sign-in");

    // Ensure they exist in our DB first
    // Since ensureUserExists is not exported from actions.ts, we'll just check settings
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
        // We can just rely on getBudgetTemplates or standard flows to init them later,
        // or just let OnboardingClient handle setting the active template
        // which calls a server action that does ensureUserExists inherently.
    }

    const activeMoneyTemplate = await db.budgetTemplate.findFirst({
        where: { userId, domain: "MONEY", isActive: true }
    });

    if (activeMoneyTemplate) {
        redirect("/dashboard");
    }

    // Fetch built-in templates to offer
    const builtInTemplates = await db.budgetTemplate.findMany({
        where: { isBuiltIn: true, domain: "MONEY" },
        include: { items: true }
    });

    // Also fetch any inactive templates they might have created but not activated
    const userTemplates = await db.budgetTemplate.findMany({
        where: { userId, domain: "MONEY", isActive: false },
        include: { items: true }
    });

    return (
        <div className={layoutStyles.layoutPaperBanana}>
            <main className={layoutStyles.mainPaperBanana}>
                <div className={layoutStyles.containerPaperBanana} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '1rem' }}>
                    <OnboardingClient
                        builtInTemplates={builtInTemplates as any}
                        userTemplates={userTemplates as any}
                    />
                </div>
            </main>
        </div>
    );
}
