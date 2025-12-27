import { getEnvelopeDetails } from "@/lib/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./page.module.css";
import { notFound } from "next/navigation";

export default async function EnvelopeDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const envelope = await getEnvelopeDetails(Number(id));

    if (!envelope) {
        notFound();
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <Link href="/dashboard" className={styles.backBtn}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <div>
                        <h1 className={styles.title}>{envelope.name}</h1>
                        <p className={styles.subtitle}>Transaction History</p>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Remaining: </span>
                    <span className={styles.summaryValue}>{envelope.remaining.toFixed(2)} Hours</span>
                </div>
            </header>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th className="text-right">Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {envelope.transactions.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center text-gray-500 py-8">
                                    No transactions yet.
                                </td>
                            </tr>
                        ) : (
                            envelope.transactions.map((t) => (
                                <tr key={t.id}>
                                    <td>{t.date.toLocaleDateString()}</td>
                                    <td>{t.description || "-"}</td>
                                    <td className="text-right font-bold">{Number(t.amount).toFixed(2)}h</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
