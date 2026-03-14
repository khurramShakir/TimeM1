"use client";

import React, { useState } from "react";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { deleteTransaction } from "@/lib/actions";
import { LogTimeModal } from "@/components/transactions/LogTimeModal";
import styles from "./TransactionHistory.module.css";
import { useSearchParams } from "next/navigation";

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
    isSystemAdjustment?: boolean;
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

const COLOR_MAP: Record<string, string> = {
    blue: "#7dd3fc",
    green: "#86efac",
    purple: "#d8b4fe",
    red: "#fca5a5",
    gray: "#d1d5db",
    default: "#94a3b8"
};

import { formatValue } from "@/lib/format";
import { Search } from "lucide-react";
import { getTransactions } from "@/lib/actions";

export default function TransactionHistory({ transactions: initialTransactions, envelopes, domain = "TIME", currency = "USD" }: TransactionHistoryProps) {
    const [transactions, setTransactions] = useState(initialTransactions);
    const [filterEnvelopeId, setFilterEnvelopeId] = useState<string>("all");
    const [showSystem, setShowSystem] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchScope, setSearchScope] = useState<"CURRENT" | "ALL">("CURRENT");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const dateStr = searchParams.get("date");
    const periodType = searchParams.get("type") || (domain === "TIME" ? "WEEKLY" : "MONTHLY");

    // Filter transactions based on UI state
    const filteredTransactions = transactions.filter(t => {
        if (filterEnvelopeId !== "all" && t.envelope.id.toString() !== filterEnvelopeId) return false;
        if (!showSystem && t.isSystemAdjustment) return false;
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const amount = t.amount.toString();
            const entity = t.entity?.toLowerCase() || "";
            const notes = t.description.toLowerCase();
            
            if (!entity.includes(query) && !notes.includes(query) && !amount.includes(query)) {
                return false;
            }
        }
        
        return true;
    });

    // Unified Fetching Logic
    const refreshTransactions = React.useCallback(async (query: string, scope: "CURRENT" | "ALL") => {
        setIsLoading(true);
        try {
            const results = await getTransactions(
                domain, 
                1000, // Fetch more for history
                scope === "CURRENT" ? (dateStr || new Date().toISOString()) : undefined, 
                scope === "CURRENT" ? periodType : undefined, 
                scope === "ALL",
                query
            );
            setTransactions(results as any);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
        }
    }, [domain, dateStr, periodType]);

    // Handle Search Scope Change
    const handleScopeChange = (scope: "CURRENT" | "ALL") => {
        setSearchScope(scope);
        refreshTransactions(searchQuery, scope);
    };

    // Debounced Search Re-fetching
    React.useEffect(() => {
        if (!searchQuery) {
            // If empty, restore initial or current period base results depending on scope
            if (searchScope === "CURRENT") {
                setTransactions(initialTransactions);
            } else {
                refreshTransactions("", "ALL");
            }
            return;
        }

        const timer = setTimeout(() => {
            refreshTransactions(searchQuery, searchScope);
        }, 400); // 400ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, searchScope, initialTransactions, refreshTransactions]);

    const totalPages = Math.ceil(filteredTransactions.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

    // Reset pagination when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterEnvelopeId, showSystem, pageSize, searchQuery, searchScope]);

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

    // Color map for envelope squares matching the mockup
    const getEnvColorClass = (color: string) => {
        const map: Record<string, string> = {
            blue: styles.envBlue,
            purple: styles.envPurple,
            green: styles.envGreen,
            orange: styles.envOrange,
            red: styles.envRed,
            gray: styles.envGray,
            default: styles.envGray
        };
        return map[color] || styles.envGray;
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
                <div className={styles.topRow}>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchInputWrapper}>
                            <Search className={styles.searchIcon} size={18} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search by name, notes, or amount..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className={styles.scopeSelector}>
                            <button 
                                className={`${styles.scopeBtn} ${searchScope === "CURRENT" ? styles.scopeBtnActive : ""}`}
                                onClick={() => handleScopeChange("CURRENT")}
                            >
                                This Month
                            </button>
                            <button 
                                className={`${styles.scopeBtn} ${searchScope === "ALL" ? styles.scopeBtnActive : ""}`}
                                onClick={() => handleScopeChange("ALL")}
                            >
                                All History
                            </button>
                        </div>
                    </div>

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

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={showSystem}
                                onChange={(e) => setShowSystem(e.target.checked)}
                            />
                            Show System
                        </label>

                        <select
                            className={styles.pageSizeSelect}
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            title="Transactions per page"
                        >
                            <option value={25}>25 / page</option>
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>
                        </select>

                        <button className={styles.logBtn} onClick={handleNew}>
                            + LOG {domain === "TIME" ? "TIME" : "MONEY"}
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                {isLoading ? (
                    <div className={styles.noData}>
                        <Loader2 className={styles.spinner} />
                        Searching...
                    </div>
                ) : paginatedTransactions.length === 0 ? (
                    <div className={styles.noData}>No transactions found. {searchQuery ? "Try a different search term or check 'All History'." : ""}</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.colEnv} title="Envelope"></th>
                                <th style={{ width: '120px' }}>Date</th>
                                <th style={{ width: '180px' }}>{domain === "TIME" ? "Activity" : "Payee/Payer"}</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'left', width: '140px' }}>{domain === "TIME" ? "Hours" : "Amount"}</th>
                                <th className={styles.colActions}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.map(t => {
                                return (
                                    <tr key={t.id}>
                                        <td className={styles.colEnv}>
                                            <div 
                                                className={`${styles.envSquare} ${getEnvColorClass(t.envelope.color)}`} 
                                                title={t.envelope.name}
                                            ></div>
                                        </td>
                                        <td className={styles.date}>
                                            <span suppressHydrationWarning>
                                                {new Date(t.date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.entityColumn}>
                                                <div className={styles.entityRow}>
                                                    <div className={styles.entityName}>{t.entity || "-"}</div>
                                                </div>
                                                {t.refNumber && <div className={styles.refNumber}>#{t.refNumber}</div>}
                                            </div>
                                        </td>
                                        <td className={styles.description}>
                                            {t.isSystemAdjustment && <span className={styles.descIcon}>🔄</span>}
                                            {formatNote(t.description)}
                                        </td>
                                        <td className={`${styles.amount} ${t.type === "INCOME" ? styles.amountPositive : ""} ${t.type === "TRANSFER" ? styles.amountTransfer : ""}`}>
                                            {t.type === "INCOME" ? "+" : ""}
                                            {formatValue(Number(t.amount), domain, currency)}
                                        </td>
                                        <td className={styles.colActions}>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => handleEdit(t)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDelete(t.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
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

            {filteredTransactions.length > 0 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredTransactions.length)} of {filteredTransactions.length}
                    </div>
                    <div className={styles.paginationControls}>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span className={styles.pageIndicator}>
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}


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
