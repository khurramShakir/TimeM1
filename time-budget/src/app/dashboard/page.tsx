import { getBudgetSummary } from "@/lib/actions";
import { EnvelopeCard } from "@/components/ui/EnvelopeCard";
import { LogTimeTrigger } from "@/components/transactions/LogTimeTrigger";
import { TransferTrigger } from "@/components/transfers/TransferTrigger";
import { BudgetChart } from "@/components/charts/BudgetChart";
import styles from "./page.module.css";

export default async function DashboardPage() {
    // Fetch data for User ID 1 (Test User)
    const data = await getBudgetSummary(1);

    if (!data) {
        return <div>No active budget found. Please run the seed script.</div>;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Current Week</h1>
                    <p className={styles.subtitle}>
                        {data.period.startDate.toLocaleDateString()} - Week {data.period.id}
                    </p>
                </div>
                <TransferTrigger envelopes={data.envelopes.map(e => ({ id: e.id, name: e.name, remaining: e.remaining }))} />
            </header>

            <section className={styles.chartSection}>
                <BudgetChart
                    envelopes={data.envelopes.map(e => ({
                        id: e.id,
                        name: e.name,
                        budgeted: e.budgeted,
                        spent: e.spent,
                        color: e.color || "blue"
                    }))}
                    totalBudgeted={data.totalBudgeted}
                />
            </section>

            {/* Real Envelope Grid */}
            <div className={styles.grid}>
                {data.envelopes.map((env) => (
                    <EnvelopeCard
                        key={env.id}
                        id={env.id}
                        name={env.name}
                        budgeted={env.budgeted}
                        spent={env.spent}
                        remaining={env.remaining}
                        color={env.color}
                    />
                ))}
            </div>
        </div>
    );
}
