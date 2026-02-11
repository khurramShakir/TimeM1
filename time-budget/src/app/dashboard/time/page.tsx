import { getBudgetSummary, initNewPeriod, getUserSettings, getTransactions } from "@/lib/actions";
export const dynamic = "force-dynamic";
import { EnvelopeCard } from "@/components/ui/EnvelopeCard";
import { TransferTrigger } from "@/components/transfers/TransferTrigger";
import { BudgetChart } from "@/components/charts/BudgetChart";
import { DateNavigation } from "@/components/layout/DateNavigation";
import { PeriodToggle } from "@/components/layout/PeriodToggle";
import styles from "./page.module.css";
import { revalidatePath } from "next/cache";
import { UrlModalTrigger } from "@/components/transactions/UrlModalTrigger";
import { UnifiedHUD } from "@/components/dashboard/UnifiedHUD";
import { Suspense } from "react";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

interface PageProps {
    searchParams: Promise<{ date?: string; type?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
    const { date: dateStr } = await searchParams; // Ignore type param
    const settings = await getUserSettings();
    const periodType = "WEEKLY"; // Force Weekly for Time

    const [data, recentTransactions] = await Promise.all([
        getBudgetSummary(dateStr, "TIME", periodType),
        getTransactions("TIME", 5)
    ]);

    const currentDate = dateStr ? new Date(dateStr) : new Date();

    const handleInitPeriod = async () => {
        "use server";
        await initNewPeriod(currentDate, "TIME", periodType);
        revalidatePath("/dashboard/time");
    };

    if (!data.period) {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.title}>Time Dashboard</h1>
                        <p className={styles.subtitle}>Track and manage your time capacity</p>
                    </div>
                    <div className={styles.headerControls}>
                        <DateNavigation currentDate={currentDate} weekStart={data.weekStart} periodType={periodType} />
                    </div>
                </header>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🗓️</div>
                    <h2 className={styles.emptyTitle}>No budget found</h2>
                    <p className={styles.emptyText}>
                        Initialize this week to start managing your time.
                    </p>
                    <form action={handleInitPeriod}>
                        <button type="submit" className={styles.initBtn}>
                            Start New Week
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const salvagedEnvelopesForTransfer = data.envelopes.map((e: any) => ({
        id: e.id,
        name: e.name,
        remaining: Number(e.remaining)
    }));

    console.log("Rendering Dashboard. Envelopes count:", data.envelopes.length);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>Time Dashboard</h1>
                    <p className={styles.subtitle}>Weekly overview of your time budget</p>
                </div>
                <div className={styles.headerControls}>
                    <DateNavigation currentDate={currentDate} weekStart={data.weekStart} periodType={periodType} />
                </div>
            </header>

            <Suspense fallback={<div style={{ height: '100px' }} />}>
                <UnifiedHUD date={dateStr} />
            </Suspense>

            <div className={styles.contentGrid}>
                <div className={styles.chartSection}>
                    <BudgetChart
                        envelopes={data.envelopes}
                        totalBudgeted={data.totalBudgeted}
                        totalAvailable={data.totalAvailable}
                        domain="TIME"
                    />
                </div>
                <div className={styles.transactionsSection}>
                    <RecentTransactions
                        transactions={recentTransactions as any[]}
                        domain="TIME"
                        currency={settings.currency}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', marginTop: '2rem' }}>
                <TransferTrigger envelopes={salvagedEnvelopesForTransfer} />
            </div>

            <div className={styles.grid}>
                {data.envelopes.map((envelope: any) => (
                    <EnvelopeCard
                        key={envelope.id}
                        {...envelope}
                        domain="TIME"
                        currency={data.currency}
                        allEnvelopes={data.envelopes}
                    />
                ))}
            </div>

            <Suspense fallback={null}>
                <UrlModalTrigger
                    envelopes={data.envelopes}
                    domain="TIME"
                    periodId={data.period.id}
                />
            </Suspense>

        </div>
    );
}
