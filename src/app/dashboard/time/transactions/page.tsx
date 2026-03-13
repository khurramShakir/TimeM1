import { getBudgetPeriodByDate, getTransactions, getUserSettings } from "@/lib/actions";
import TransactionHistory from "@/components/transactions/TransactionHistory";
import { DateNavigation } from "@/components/layout/DateNavigation";
import styles from "../../money/transactions/transactions.module.css"; // Reuse shared/money styles

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ type?: string; date?: string }>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
    const { type: typeStr, date: dateParam } = await searchParams;

    // Fetch settings first to get default
    const settings = await getUserSettings();
    const periodType = typeStr === "WEEKLY" ? "WEEKLY" : (typeStr === "MONTHLY" ? "MONTHLY" : (settings.defaultPeriod || "WEEKLY"));

    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Fetch data in parallel for the current authenticated user
    const [period, transactions] = await Promise.all([
        getBudgetPeriodByDate(targetDate, undefined, "TIME", periodType),
        getTransactions("TIME", undefined, dateParam, periodType),
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
        isSystemAdjustment: t.isSystemAdjustment,
        envelope: t.envelope ? {
            id: t.envelope.id,
            name: t.envelope.name,
            color: t.envelope.color || "default"
        } : { id: 0, name: "Deleted", color: "gray" },
        toEnvelopeId: t.toEnvelopeId
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>Transaction List</h1>
                    <p className={styles.subtitle}>View and filter your time logging history</p>
                </div>
                <DateNavigation currentDate={targetDate} periodType={periodType} weekStart={settings.weekStart} />
            </header>

            <TransactionHistory
                transactions={formattedTransactions}
                envelopes={envelopes}
                domain="TIME"
                currency={settings.currency}
            />
        </div>
    );
}
