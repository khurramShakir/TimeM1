export const dynamic = "force-dynamic";

import Link from "next/link";
import { Clock, Banknote, ArrowRight } from "lucide-react";
import styles from "./page.module.css";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";

export default async function DashboardGateway() {
    const authObj = await auth();
    const userId = authObj.userId;
    if (!userId) redirect("/sign-in");

    const activeTemplate = await db.budgetTemplate.findFirst({
        where: { userId, domain: "MONEY", isActive: true }
    });

    if (!activeTemplate) {
        redirect("/dashboard/onboarding");
    }

    return (
        <div className={styles.gateway}>
            <header className={styles.header}>
                <h1>Welcome back!</h1>
                <p>What would you like to manage today?</p>
            </header>

            <div className={styles.grid}>
                <Link href="/dashboard/time" className={styles.card}>
                    <div className={`${styles.iconWrapper} ${styles.timeIcon}`}>
                        <Clock size={48} />
                    </div>
                    <div className={styles.cardContent}>
                        <h2>Manage Time</h2>
                        <p>Track your hours, budget your week, and optimize your schedule.</p>
                    </div>
                    <div className={styles.arrow}>
                        <ArrowRight />
                    </div>
                </Link>

                <Link href="/dashboard/money" className={styles.card}>
                    <div className={`${styles.iconWrapper} ${styles.moneyIcon}`}>
                        <Banknote size={48} />
                    </div>
                    <div className={styles.cardContent}>
                        <h2>Manage Money</h2>
                        <p>Budget your finances using the same envelope system for your actual cash.</p>
                    </div>
                    <div className={styles.arrow}>
                        <ArrowRight />
                    </div>
                </Link>
            </div>
        </div>
    );
}
