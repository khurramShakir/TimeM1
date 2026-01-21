import { getEnvelopeDetails } from "@/lib/actions";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./page.module.css";
import { notFound } from "next/navigation";
import { formatValue } from "@/lib/format";

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

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <Link href={`/dashboard/${domain.toLowerCase()}`} className={styles.backBtn}>
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
                    <span className={styles.summaryValue}>{formatValue(envelope.remaining, domain)}</span>
                </div>
            </header>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th className="text-right">{label}</th>
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
                            envelope.transactions.map((t: any) => (
                                <tr key={t.id}>
                                    <td>{new Date(t.date).toLocaleDateString()}</td>
                                    <td>{t.description || "-"}</td>
                                    <td className="text-right font-bold">{formatValue(Number(t.amount), domain)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
