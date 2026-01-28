import { getBudgetSummary, getUserSettings } from "@/lib/actions";
export const dynamic = "force-dynamic";

import { BudgetChart } from "@/components/charts/BudgetChart";
import { DateNavigation } from "@/components/layout/DateNavigation";
import styles from "../time/page.module.css";
import reportStyles from "./page.module.css";
import { formatCurrency, formatValue } from "@/lib/format";
import { Banknote, Clock, PieChart, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

interface PageProps {
    searchParams: Promise<{ date?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
    const { date: dateStr } = await searchParams;
    const currentDate = dateStr ? new Date(dateStr) : new Date();

    // Fetch both domain summaries for the given date
    const [timeData, moneyData] = await Promise.all([
        getBudgetSummary(dateStr, "TIME", "WEEKLY"),
        getBudgetSummary(dateStr, "MONEY", "MONTHLY")
    ]);

    // Filter out "Unallocated" for intentional planning metrics
    const moneyEnvelopes = moneyData.envelopes.filter((e: any) => e.name !== "Unallocated");
    const unallocatedEnv = moneyData.envelopes.find((e: any) => e.name === "Unallocated");

    const targetGoal = moneyEnvelopes.reduce((sum: number, e: any) => sum + e.budgeted, 0);
    const allocatedCash = moneyEnvelopes.reduce((sum: number, e: any) => sum + e.funded, 0);
    const unallocatedCash = unallocatedEnv ? Number(unallocatedEnv.funded) : 0;

    const unfundedGap = Math.max(0, targetGoal - allocatedCash);
    const isUnderfunded = unfundedGap > 0;
    const isFullyFunded = allocatedCash >= targetGoal && targetGoal > 0;
    const totalCash = (moneyData.totalFunded || 0);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>Advanced Reports</h1>
                    <p className={styles.subtitle}>Comprehensive view of your time and money</p>
                </div>
                <div className={styles.headerControls}>
                    <DateNavigation currentDate={currentDate} periodType="MONTHLY" />
                </div>
            </header>

            <div className={reportStyles.reportGrid}>
                {/* Money Reports: Funding Analysis */}
                <section className={reportStyles.section}>
                    <div className={reportStyles.sectionHeader}>
                        <Banknote className="text-blue-600" size={24} />
                        <h2>Money: Funding vs Goal</h2>
                    </div>

                    <div className={reportStyles.summaryCards}>
                        <div className={reportStyles.summaryCard}>
                            <span className={reportStyles.cardLabel}>Target Goal (Plan)</span>
                            <span className={reportStyles.cardValue}>{formatValue(targetGoal, "MONEY", moneyData.currency)}</span>
                        </div>
                        <div className={reportStyles.summaryCard}>
                            <span className={reportStyles.cardLabel}>Allocated Cash</span>
                            <span className={reportStyles.cardValue} style={{ color: isFullyFunded ? '#16a34a' : '#f59e0b' }}>
                                {formatValue(allocatedCash, "MONEY", moneyData.currency)}
                            </span>
                        </div>
                        <div className={reportStyles.summaryCard}>
                            <span className={reportStyles.cardLabel}>Unallocated Cash</span>
                            <span className={reportStyles.cardValue} style={{ color: '#64748b' }}>
                                {formatValue(unallocatedCash, "MONEY", moneyData.currency)}
                            </span>
                        </div>
                        <div className={reportStyles.summaryCard}>
                            <span className={reportStyles.cardLabel}>Total Cash (Hand)</span>
                            <span className={reportStyles.cardValue} style={{ fontWeight: 700 }}>
                                {formatValue(totalCash, "MONEY", moneyData.currency)}
                            </span>
                        </div>
                    </div>

                    <div className={reportStyles.statusBox} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className={reportStyles.summaryCard} style={{ width: '100%', maxWidth: 'none', background: 'var(--surface-50)' }}>
                            <span className={reportStyles.cardLabel}>Financial Health Check</span>
                            <span className={reportStyles.cardValue} style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
                                {totalCash >= targetGoal ? "Plan is Affordable" : "Income Shortfall Detected"}
                            </span>
                            <span className={reportStyles.cardLabel} style={{ fontSize: '0.8125rem', marginTop: '0.5rem', opacity: 0.8 }}>
                                <strong>Math:</strong> Allocated ({formatValue(allocatedCash, "MONEY", moneyData.currency)}) + Unallocated ({formatValue(unallocatedCash, "MONEY", moneyData.currency)}) = <strong>{formatValue(totalCash, "MONEY", moneyData.currency)} Total Cash</strong>
                            </span>
                        </div>

                        {targetGoal > totalCash ? (
                            <div className={`${reportStyles.statusAlert} ${reportStyles.alertWarning}`} style={{ borderColor: '#ef4444' }}>
                                <AlertCircle size={20} style={{ color: '#ef4444' }} />
                                <span><strong>Warning:</strong> Your Target Goal ({formatValue(targetGoal, "MONEY", moneyData.currency)}) exceeds your Total Cash ({formatValue(totalCash, "MONEY", moneyData.currency)}). You need more income.</span>
                            </div>
                        ) : isUnderfunded ? (
                            <div className={`${reportStyles.statusAlert} ${reportStyles.alertWarning}`}>
                                <AlertCircle size={20} />
                                <span>You have enough cash, but you still need to move {formatValue(unfundedGap, "MONEY", moneyData.currency)} from **Unallocated** into your envelopes.</span>
                            </div>
                        ) : isFullyFunded ? (
                            <div className={`${reportStyles.statusAlert} ${reportStyles.alertSuccess}`}>
                                <CheckCircle2 size={20} />
                                <span>All your envelopes are fully funded for this period!</span>
                            </div>
                        ) : null}
                    </div>

                    <div className={reportStyles.chartCont}>
                        <BudgetChart
                            envelopes={moneyData.envelopes}
                            totalBudgeted={moneyData.totalBudgeted}
                            domain="MONEY"
                            currency={moneyData.currency}
                            totalAvailable={moneyData.totalAvailable}
                            periodType="MONTHLY"
                        />
                    </div>
                </section>

                {/* Time Reports: Capacity Analysis */}
                <section className={reportStyles.section}>
                    <div className={reportStyles.sectionHeader}>
                        <Clock className="text-[var(--primary)]" size={24} />
                        <h2>Time: Capacity vs Usage</h2>
                    </div>

                    <div className={reportStyles.summaryCards}>
                        <div className={reportStyles.summaryCard}>
                            <span className={reportStyles.cardLabel}>Weekly Capacity</span>
                            <span className={reportStyles.cardValue}>{timeData.totalAvailable}h</span>
                        </div>
                        <div className={reportStyles.summaryCard}>
                            <span className={reportStyles.cardLabel}>Total Budgeted</span>
                            <span className={reportStyles.cardValue}>{timeData.totalBudgeted}h</span>
                        </div>
                        <div className={reportStyles.summaryCard}>
                            <span className={reportStyles.cardLabel}>Time Spent</span>
                            <span className={reportStyles.cardValue}>{timeData.totalSpent}h</span>
                        </div>
                    </div>

                    <div className={reportStyles.chartCont}>
                        <BudgetChart
                            envelopes={timeData.envelopes}
                            totalBudgeted={timeData.totalBudgeted}
                            domain="TIME"
                            totalAvailable={timeData.totalAvailable}
                            periodType="WEEKLY"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}
