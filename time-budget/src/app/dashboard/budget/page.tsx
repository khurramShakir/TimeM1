import React from "react";
import { getBudgetSummary, initNewWeek } from "@/lib/actions";
import BudgetManager from "@/components/budget/BudgetManager";
import { DateNavigation } from "@/components/layout/DateNavigation";
import { revalidatePath } from "next/cache";
import styles from "../page.module.css";

interface PageProps {
    searchParams: Promise<{ date?: string }>;
}

export default async function BudgetPage({ searchParams }: PageProps) {
    const { date: dateStr } = await searchParams;
    const summary = await getBudgetSummary(dateStr);
    const currentDate = dateStr ? new Date(dateStr) : new Date();

    const handleInitWeek = async () => {
        "use server";
        await initNewWeek(currentDate);
        revalidatePath("/dashboard/budget");
    };

    if (!summary.period) {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <DateNavigation currentDate={currentDate} />
                </header>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🗓️</div>
                    <h2 className={styles.emptyTitle}>No budget found for this week</h2>
                    <p className={styles.emptyText}>
                        Initialize this week to start managing your envelopes.
                    </p>
                    <form action={handleInitWeek}>
                        <button type="submit" className={styles.initBtn}>
                            Start New Week
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Convert Decimals to numbers for client component
    const sanitizedEnvelopes = summary.envelopes.map((env: any) => ({
        ...env,
        budgeted: Number(env.budgeted),
        spent: Number(env.spent),
        remaining: Number(env.remaining),
        color: env.color || "gray"
    }));

    return (
        <div className={styles.page}>
            <header className={styles.header} style={{ marginBottom: '1rem' }}>
                <DateNavigation currentDate={currentDate} />
            </header>
            <BudgetManager
                userId={summary.period.userId as any}
                initialEnvelopes={sanitizedEnvelopes}
                currentDate={currentDate.toISOString().split("T")[0]}
            />
        </div>
    );
}
