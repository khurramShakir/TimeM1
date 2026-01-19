import { getBudgetSummary, initNewPeriod } from "@/lib/actions";
import { EnvelopeCard } from "@/components/ui/EnvelopeCard";
import { TransferTrigger } from "@/components/transfers/TransferTrigger";
import { BudgetChart } from "@/components/charts/BudgetChart";
import { DateNavigation } from "@/components/layout/DateNavigation";
import { PeriodToggle } from "@/components/layout/PeriodToggle";
import styles from "../time/page.module.css";
import { revalidatePath } from "next/cache";

interface PageProps {
    searchParams: Promise<{ date?: string; type?: string }>;
}

export default async function MoneyDashboardPage({ searchParams }: PageProps) {
    const { date: dateStr, type: typeStr } = await searchParams;
    const periodType = typeStr === "WEEKLY" ? "WEEKLY" : (typeStr === "MONTHLY" ? "MONTHLY" : "MONTHLY");

    // We use "MONEY" domain
    const data = await getBudgetSummary(dateStr, "MONEY", periodType);
    const currentDate = dateStr ? new Date(dateStr) : new Date();

    const handleInitPeriod = async () => {
        "use server";
        await initNewPeriod(currentDate, "MONEY", periodType);
        revalidatePath("/dashboard/money");
    };

    if (!data.period) {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.title}>Money Dashboard</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PeriodToggle defaultType="MONTHLY" />
                            <DateNavigation currentDate={currentDate} periodType={periodType} />
                        </div>
                    </div>
                </header>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>💰</div>
                    <h2 className={styles.emptyTitle}>No {periodType.toLowerCase()} money budget found</h2>
                    <p className={styles.emptyText}>
                        It looks like you haven't started your money budget for this {periodType === 'MONTHLY' ? 'month' : 'week'} yet.
                        We can set up your default categories to get you started!
                    </p>
                    <form action={handleInitPeriod}>
                        <button type="submit" className={styles.initBtn}>
                            Start New {periodType === 'MONTHLY' ? 'Monthly' : 'Money'} Budget
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>Money Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PeriodToggle defaultType="MONTHLY" />
                        <DateNavigation currentDate={currentDate} periodType={periodType} />
                    </div>
                </div>
                <TransferTrigger envelopes={data.envelopes.map((e: any) => ({ id: e.id, name: e.name, remaining: e.remaining }))} />
            </header>

            <section className={styles.chartSection}>
                <BudgetChart
                    envelopes={data.envelopes.map((e: any) => ({
                        id: e.id,
                        name: e.name,
                        budgeted: e.budgeted,
                        spent: e.spent,
                        color: e.color || "blue"
                    }))}
                    totalBudgeted={data.totalBudgeted}
                    domain="MONEY"
                    periodType={periodType}
                />
            </section>

            <div className={styles.grid}>
                {data.envelopes.map((env: any) => (
                    <EnvelopeCard
                        key={env.id}
                        id={env.id}
                        name={env.name}
                        budgeted={env.budgeted}
                        spent={env.spent}
                        remaining={env.remaining}
                        color={env.color}
                        domain="MONEY"
                    />
                ))}
            </div>
        </div>
    );
}
