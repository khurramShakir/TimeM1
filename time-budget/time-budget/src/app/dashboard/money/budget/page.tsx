import React from "react";
export const dynamic = "force-dynamic";
import { getBudgetSummary, initNewPeriod, getUserSettings } from "@/lib/actions";
import BudgetManager from "@/components/budget/BudgetManager";
import { DateNavigation } from "@/components/layout/DateNavigation";
import styles from "../../time/page.module.css";

interface PageProps {
    searchParams: Promise<{ date?: string; type?: string }>;
}

export default async function MoneyBudgetPage({ searchParams }: PageProps) {
    const { date: dateStr } = await searchParams;
    const settings = await getUserSettings();
    const domain = "MONEY";
    const periodType = "MONTHLY";

    const currentDate = dateStr ? new Date(dateStr) : new Date();
    let summary = await getBudgetSummary(currentDate, domain, periodType);

    if (!summary.period) {
        await initNewPeriod(currentDate, domain, periodType);
        summary = await getBudgetSummary(currentDate, domain, periodType);
    }

    const currencySymbolMap: Record<string, string> = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        CAD: "C$",
        AUD: "A$"
    };
    const currency = currencySymbolMap[settings.currency] || settings.currency;

    if (!summary.period) {
        return <div className={styles.page}><p>Failed to initialize budget.</p></div>;
    }

    const sanitizedEnvelopes = summary.envelopes.map((env: any) => ({
        ...env,
        budgeted: Number(env.budgeted),
        spent: Number(env.spent),
        remaining: Number(env.remaining),
        color: env.color || "gray"
    }));

    return (
        <div className={styles.page}>
            <div className={styles.centeredContent}>
                <header style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                    <DateNavigation currentDate={currentDate} weekStart={settings.weekStart} periodType={periodType} />
                </header>
                <BudgetManager
                    userId={summary.period.userId as any}
                    periodId={summary.period.id}
                    initialEnvelopes={sanitizedEnvelopes}
                    initialCapacity={Number(summary.period.capacity)}
                    currentDate={currentDate.toISOString().split("T")[0]}
                    domain={domain}
                    currency={currency}
                    periodType={periodType}
                />
            </div>
        </div>
    );
}
