import { getBudgetSummary, initNewWeek } from "@/lib/actions";
import { EnvelopeCard } from "@/components/ui/EnvelopeCard";
import { TransferTrigger } from "@/components/transfers/TransferTrigger";
import { BudgetChart } from "@/components/charts/BudgetChart";
import { DateNavigation } from "@/components/layout/DateNavigation";
import styles from "./page.module.css";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
    const { date: dateStr } = await searchParams;
    const data = await getBudgetSummary(dateStr);
    const currentDate = dateStr ? new Date(dateStr) : new Date();

    const handleInitWeek = async () => {
        "use server";
        await initNewWeek(currentDate);
        revalidatePath("/dashboard");
    };

    if (!data.period) {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <DateNavigation currentDate={currentDate} />
                </header>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🗓️</div>
                    <h2 className={styles.emptyTitle}>No budget found for this week</h2>
                    <p className={styles.emptyText}>
                        It looks like you haven't started your budget for this week yet.
                        We can copy your latest categories to get you started!
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

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>Dashboard</h1>
                    <DateNavigation currentDate={currentDate} />
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
                    />
                ))}
            </div>
        </div>
    );
}
