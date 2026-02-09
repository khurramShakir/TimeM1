import { getBudgetPeriodByDate, getTransactions, getUserSettings } from "@/lib/actions";
import TransactionHistory from "@/components/transactions/TransactionHistory";
import styles from "./transactions.module.css";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ type?: string }>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
    const { type: typeStr } = await searchParams;

    // Fetch settings first to get default if type param is missing
    const settings = await getUserSettings();
    const periodType = typeStr === "WEEKLY" ? "WEEKLY" : (typeStr === "MONTHLY" ? "MONTHLY" : (settings.defaultPeriod || "MONTHLY"));

    // Fetch data in parallel for the current authenticated user
    const [period, transactions] = await Promise.all([
        getBudgetPeriodByDate(new Date(), undefined, "MONEY", periodType),
        getTransactions("MONEY"),
    ]);

    // Extract envelopes for filter
    const envelopes = (period as any)?.envelopes ? (period as any).envelopes.map((e: any) => ({ id: e.id, name: e.name })) : [];

    // Transform transactions for the client component (Decimal -> number, Date -> Date)
    const formattedTransactions = (transactions as any[]).map(t => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type || "EXPENSE",
        description: t.description || "",
        entity: t.entity || null,
        refNumber: t.refNumber || null,
        date: t.date,
        startTime: t.startTime,
        endTime: t.endTime,
        envelope: {
            id: t.envelope.id,
            name: t.envelope.name,
            color: t.envelope.color || "default"
        },
        toEnvelopeId: t.toEnvelopeId
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>Money Transactions</h1>
                    <p className={styles.subtitle}>View and filter your financial spending history</p>
                </div>
            </header>

            <TransactionHistory
                transactions={formattedTransactions}
                envelopes={envelopes}
                domain="MONEY"
                currency={settings.currency}
            />
        </div>
    );
}
