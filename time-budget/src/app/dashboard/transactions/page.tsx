import { getCurrentBudgetPeriod, getTransactions } from "@/lib/actions";
import TransactionHistory from "@/components/transactions/TransactionHistory";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
    // Fetch data in parallel for the current authenticated user
    const [period, transactions] = await Promise.all([
        getCurrentBudgetPeriod(),
        getTransactions()
    ]);

    // Extract envelopes for filter
    const envelopes = (period as any)?.envelopes ? (period as any).envelopes.map((e: any) => ({ id: e.id, name: e.name })) : [];

    // Transform transactions for the client component (Decimal -> number, Date -> Date)
    const formattedTransactions = (transactions as any[]).map(t => ({
        id: t.id,
        amount: Number(t.amount),
        description: t.description || "",
        date: t.date,
        startTime: t.startTime,
        endTime: t.endTime,
        envelope: {
            id: t.envelope.id,
            name: t.envelope.name,
            color: t.envelope.color || "default"
        }
    }));

    return (
        <div style={{ paddingBottom: "2rem" }}>
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "var(--foreground)" }}>
                    Transaction List
                </h1>
                <p style={{ color: "var(--foreground)", opacity: 0.6 }}>
                    View and filter your time logging history.
                </p>
            </div>

            <TransactionHistory
                transactions={formattedTransactions}
                envelopes={envelopes}
            />
        </div>
    );
}
