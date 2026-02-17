import { getBudgetSummary, getEnvelopeDetails } from "@/lib/actions";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import styles from "./page.module.css";
import { notFound } from "next/navigation";
import { formatValue } from "@/lib/format";
import { UrlModalTrigger } from "@/components/transactions/UrlModalTrigger";

export default async function EnvelopeDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const envelope = await getEnvelopeDetails(Number(id)) as any;

    if (!envelope) {
        notFound();
    }

    const domain = envelope.domain || "TIME";
    const label = domain === "TIME" ? "Hours" : "Amount";

    // Fetch all envelopes for the period to provide context for the modal
    const summary = await getBudgetSummary(envelope.period.startDate, domain, envelope.period.type);
    const envelopes = summary.envelopes.map(e => ({ id: e.id, name: e.name, funded: e.funded }));

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <Link href={`/dashboard/${domain.toLowerCase()}`} className={styles.backBtn}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <div>
                        <h1 className={styles.title}>{envelope.name}</h1>
                        <p className={styles.subtitle}>Transaction History</p>
                    </div>
                </div>
                <div className={styles.actionSection}>
                    <Link
                        href={`?action=${domain === "TIME" ? "log_time" : "add_transaction"}`}
                        replace
                        scroll={false}
                        className={styles.logBtn}
                    >
                        <Plus size={18} />
                        Log {domain === "TIME" ? "Time" : "Money"}
                    </Link>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Remaining: </span>
                        <span className={styles.summaryValue}>{formatValue(envelope.remaining, domain)}</span>
                    </div>
                </div>
            </header>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>{domain === "TIME" ? "Activity" : "Payee/Payer"}</th>
                            <th>Description</th>
                            <th className="text-right">{label}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {envelope.transactions.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center text-gray-500 py-8">
                                    No transactions yet.
                                </td>
                            </tr>
                        ) : (
                            envelope.transactions.map((t: any) => {
                                const isIncome = t.type === "INCOME";
                                return (
                                    <tr key={t.id}>
                                        <td>{new Date(t.date).toLocaleDateString()}</td>
                                        <td>{t.entity || "-"}</td>
                                        <td>{t.description || "-"}</td>
                                        <td className={`text-right font-bold ${isIncome ? styles.amountIncome : ""}`}>
                                            {isIncome ? "+" : ""}
                                            {formatValue(Number(t.amount), domain)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <UrlModalTrigger
                envelopes={envelopes}
                domain={domain}
                periodId={envelope.periodId}
            />
        </div>
    );
}
