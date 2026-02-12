"use client";

import React, { useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import { deleteTransaction } from "@/lib/actions";
import { LogTimeModal } from "@/components/transactions/LogTimeModal";
import styles from "./TransactionHistory.module.css";

interface Transaction {
    id: number;
    amount: number;
    type?: string;
    description: string;
    entity?: string | null;
    refNumber?: string | null;
    date: Date;
    envelope: {
        id: number;
        name: string;
        color: string;
    };
    toEnvelopeId?: number | null;
    startTime?: Date | null;
    endTime?: Date | null;
}

interface Envelope {
    id: number;
    name: string;
}

interface TransactionHistoryProps {
    transactions: Transaction[];
    envelopes: Envelope[];
    domain?: string;
    currency?: string;
}

const COLOR_STYLES: Record<string, { bg: string, text: string }> = {
    blue: { bg: "#dbeafe", text: "#1e40af" },
    green: { bg: "#d1fae5", text: "#065f46" },
    purple: { bg: "#f3e8ff", text: "#6b21a8" },
    red: { bg: "#fee2e2", text: "#991b1b" },
    gray: { bg: "#f3f4f6", text: "#1f2937" },
    default: { bg: "#cbd5e1", text: "#1e293b" }
};

import { formatValue } from "@/lib/format";

export default function TransactionHistory({ transactions, envelopes, domain = "TIME", currency = "USD" }: TransactionHistoryProps) {
    const [filterEnvelopeId, setFilterEnvelopeId] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const filteredTransactions = filterEnvelopeId === "all"
        ? transactions
        : transactions.filter(t => t.envelope.id.toString() === filterEnvelopeId);

    // Truncate notes to a fixed length to prevent alignment issues
    const formatNote = (note: string | null) => {
        if (!note) return "-";

        const maxLength = 30;
        if (note.length > maxLength) {
            return note.substring(0, maxLength - 3) + "...";
        }
        return note;
    };

    const handleEdit = (t: Transaction) => {
        setEditingTransaction(t);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this transaction? This cannot be undone.")) {
            await deleteTransaction(id);
        }
    };

    const handleNew = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };

    // Helper to map UI Transaction to Modal Transaction format
    const modalTransaction = React.useMemo(() => editingTransaction ? {
        id: editingTransaction.id,
        envelopeId: editingTransaction.envelope.id,
        toEnvelopeId: editingTransaction.toEnvelopeId,
        type: editingTransaction.type || "EXPENSE",
        amount: editingTransaction.amount,
        description: editingTransaction.description,
        entity: editingTransaction.entity || null,
        refNumber: editingTransaction.refNumber || null,
        date: editingTransaction.date,
        startTime: editingTransaction.startTime,
        endTime: editingTransaction.endTime
    } : null, [editingTransaction]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>History</h2>
                <div className={styles.controls}>
                    <select
                        className={styles.select}
                        value={filterEnvelopeId}
                        onChange={(e) => setFilterEnvelopeId(e.target.value)}
                    >
                        <option value="all">All Envelopes</option>
                        {envelopes.map(env => (
                            <option key={env.id} value={env.id}>{env.name}</option>
                        ))}
                    </select>
                    <button className={styles.logBtn} onClick={handleNew}>
                        <Plus size={20} />
                        {domain === "TIME" ? "Log Time" : "Log Money"}
                    </button>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                {filteredTransactions.length === 0 ? (
                    <div className={styles.noData}>No transactions found.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>{domain === "TIME" ? "Activity" : "Payee/Payer"}</th>
                                <th>Envelope</th>
                                <th>Notes</th>
                                <th>{domain === "TIME" ? "Hours" : "Amount"}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(t => {
                                const colorStyle = COLOR_STYLES[t.envelope.color] || COLOR_STYLES.default;
                                return (
                                    <tr key={t.id}>
                                        <td className={styles.date}>
                                            <span suppressHydrationWarning>
                                                {new Date(t.date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.entityColumn}>
                                                <div className={styles.entityName}>{t.entity || "-"}</div>
                                                {t.refNumber && <div className={styles.refNumber}>#{t.refNumber}</div>}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={styles.envelopeBadge}
                                                style={{ backgroundColor: colorStyle.bg, color: colorStyle.text }}
                                            >
                                                {t.envelope.name}
                                            </span>
                                        </td>
                                        <td className={styles.description}>{formatNote(t.description)}</td>
                                        <td className={`${styles.amount} ${t.type === "INCOME" ? styles.amountPositive : ""} ${t.type === "TRANSFER" ? styles.amountTransfer : ""}`}>
                                            {t.type === "INCOME" ? "+" : ""}
                                            {formatValue(Number(t.amount), domain, currency)}
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => handleEdit(t)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDelete(t.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <LogTimeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                envelopes={envelopes}
                transaction={modalTransaction}
                domain={domain}
                currency={currency}
            />
        </div>
    );
}
