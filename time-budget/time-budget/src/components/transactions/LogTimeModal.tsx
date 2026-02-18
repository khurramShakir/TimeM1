"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createTransaction, updateTransaction, getRecentEntities } from "@/lib/actions";
import styles from "./LogTimeModal.module.css";
import { getLightColor, getThemeColor } from "@/lib/colors";

interface Envelope {
    id: number;
    name: string;
    color?: string | null;
}

interface LogTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    envelopes: Envelope[];
    initialEnvelopeId?: number;
    transaction?: {
        id: number;
        envelopeId: number;
        toEnvelopeId?: number | null;
        type: string;
        amount: number;
        description: string;
        entity: string | null;
        refNumber: string | null;
        date: Date;
        startTime?: Date | null;
        endTime?: Date | null;
    } | null;
    domain?: string;
    currency?: string;
}

type Mode = "duration" | "range";

const SYMBOL_MAP: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$"
};

export function LogTimeModal({ isOpen, onClose, envelopes, initialEnvelopeId, transaction, domain = "TIME", currency = "USD" }: LogTimeModalProps) {
    const [tab, setTab] = useState<string>("EXPENSE"); // EXPENSE, TRANSFER, INCOME
    const [mode, setMode] = useState<Mode>("duration");
    const [envelopeId, setEnvelopeId] = useState<number>(envelopes[0]?.id || 0);
    const [toEnvelopeId, setToEnvelopeId] = useState<number>(envelopes[1]?.id || envelopes[0]?.id || 0);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [amount, setAmount] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [entity, setEntity] = useState(""); // Payee/Payer
    const [refNumber, setRefNumber] = useState(""); // Check #
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Lock body scroll when modal is open (prevents horizontal scrollbar from tabs)
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isOpen]);

    // Fetch suggestions for autocomplete
    useEffect(() => {
        if (isOpen && tab !== "TRANSFER") {
            const loadSuggestions = async () => {
                try {
                    const data = await getRecentEntities(tab, domain);
                    setSuggestions(data);
                } catch (err) {
                    console.error("Failed to load suggestions:", err);
                }
            };
            loadSuggestions();
        }
    }, [isOpen, tab, domain]);

    // Reset or Populate form when opening
    useEffect(() => {
        if (isOpen) {
            if (transaction) {
                // EDIT MODE
                setTab(transaction.type || "EXPENSE");
                setMode(transaction.startTime && transaction.endTime ? "range" : "duration");
                setEnvelopeId(transaction.envelopeId);
                setToEnvelopeId(transaction.toEnvelopeId || 0);
                setDate(new Date(transaction.date).toISOString().split("T")[0]);
                setAmount(transaction.amount.toString());
                setEntity(transaction.entity || "");
                setRefNumber(transaction.refNumber || "");
                setDescription(transaction.description || "");

                if (transaction.startTime && transaction.endTime) {
                    setStartTime(new Date(transaction.startTime).toTimeString().slice(0, 5));
                    setEndTime(new Date(transaction.endTime).toTimeString().slice(0, 5));
                } else {
                    setStartTime("");
                    setEndTime("");
                }
            } else {
                // CREATE MODE - Defaults
                setTab("EXPENSE");
                setMode("duration");
                setAmount("");
                setStartTime("");
                setEndTime("");
                setEntity("");
                setRefNumber("");
                setDescription("");
                if (initialEnvelopeId) {
                    setEnvelopeId(initialEnvelopeId);
                } else if (envelopes.length > 0) {
                    setEnvelopeId(envelopes[0].id);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, transaction?.id, initialEnvelopeId]); // Only reset if open state or transaction ID changes

    // Calculate duration when times change
    // Calculate duration when times change
    useEffect(() => {
        if (mode === "range" && startTime && endTime) {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);

            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                let diff = (end.getTime() - start.getTime()) / 1000 / 3600;
                if (diff < 0) diff += 24;
                setAmount(diff.toFixed(2));
            }
        }
    }, [startTime, endTime, mode]);

    const adjustDate = (days: number) => {
        const d = new Date(date + "T00:00:00");
        d.setDate(d.getDate() + days);
        setDate(d.toISOString().split("T")[0]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                alert("Please enter a valid amount");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                type: tab,
                envelopeId: Number(envelopeId),
                toEnvelopeId: tab === "TRANSFER" ? Number(toEnvelopeId) : undefined,
                amount: numAmount,
                entity: tab !== "TRANSFER" ? entity : undefined,
                refNumber: tab === "EXPENSE" ? refNumber : undefined,
                description,
                date: new Date(date),
                startTime: mode === "range" && startTime ? new Date(`${date}T${startTime}`) : undefined,
                endTime: mode === "range" && endTime ? new Date(`${date}T${endTime}`) : undefined,
            };

            if (transaction) {
                await updateTransaction(transaction.id, payload);
            } else {
                await createTransaction(payload);
            }

            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to save transaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedEnvelope = envelopes.find(e => e.id === Number(envelopeId));

    const overlayRef = React.useRef<HTMLDivElement>(null);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    };

    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    // Use Portal to escape stacking context of parent Cards
    return createPortal(
        <div
            ref={overlayRef}
            className={styles.overlay}
            onClick={handleOverlayClick}
            onMouseDown={stopPropagation}
            onMouseUp={stopPropagation}
        >
            <div
                className={styles.modal}
                onClick={stopPropagation}
                onMouseDown={stopPropagation}
                onMouseUp={stopPropagation}
            >
                <div className={styles.modalLayout}>
                    {/* Sidebar / Top Navigation (Tabs) */}
                    <div className={styles.sidebar}>
                        <div className={styles.tabs}>
                            <button
                                type="button"
                                data-tab="EXPENSE"
                                className={`${styles.tab} ${tab === "EXPENSE" ? styles.activeTab : ""}`}
                                onClick={() => setTab("EXPENSE")}
                            >
                                {domain === "TIME" ? "Log Activity" : "Expense"}
                            </button>
                            <button
                                type="button"
                                data-tab="INCOME"
                                className={`${styles.tab} ${tab === "INCOME" ? styles.activeTab : ""}`}
                                onClick={() => setTab("INCOME")}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                data-tab="TRANSFER"
                                className={`${styles.tab} ${tab === "TRANSFER" ? styles.activeTab : ""}`}
                                onClick={() => setTab("TRANSFER")}
                            >
                                Transfer
                            </button>
                        </div>
                    </div>

                    {/* Main Form Content */}
                    <div className={styles.contentArea} data-watermark={tab}>
                        <h2 className={styles.title}>{domain === "TIME" ? "Log Activity" : "Add Transaction"}</h2>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Primary Decisions: Envelope */}
                            <div
                                className={styles.prominentGroup}
                                style={{
                                    borderTopColor: getThemeColor(selectedEnvelope?.color)
                                }}
                            >
                                <label
                                    className={styles.prominentLabel}
                                >
                                    {tab === "EXPENSE" ? "Spending From" : (tab === "TRANSFER" ? "Move From" : "Target Envelope")}
                                </label>
                                <select
                                    value={envelopeId}
                                    onChange={(e) => setEnvelopeId(Number(e.target.value))}
                                    required
                                    className={styles.prominentSelect}
                                >
                                    {envelopes.map(env => (
                                        <option key={env.id} value={env.id}>{env.name}</option>
                                    ))}
                                </select>
                            </div>

                            {tab === "TRANSFER" && (
                                <div className={styles.prominentGroup}>
                                    <label className={styles.prominentLabel}>Move To</label>
                                    <select
                                        value={toEnvelopeId}
                                        onChange={(e) => setToEnvelopeId(Number(e.target.value))}
                                        required
                                        className={styles.prominentSelect}
                                    >
                                        {envelopes.map(env => (
                                            <option key={env.id} value={env.id}>{env.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className={styles.row}>
                                <div className={styles.group}>
                                    <label>Date</label>
                                    <div className={styles.dateGroup}>
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                            className={styles.dateInput}
                                        />
                                        <div className={styles.quickDates}>
                                            <button
                                                type="button"
                                                className={styles.quickDateBtn}
                                                onClick={() => adjustDate(-1)}
                                                title="Previous Day"
                                            >
                                                -1
                                            </button>
                                            <button
                                                type="button"
                                                className={`${styles.quickDateBtn} ${styles.todayBtn}`}
                                                onClick={() => setDate(new Date().toISOString().split("T")[0])}
                                            >
                                                Today
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.quickDateBtn}
                                                onClick={() => adjustDate(1)}
                                                title="Next Day"
                                            >
                                                +1
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {tab === "EXPENSE" && (
                                    <div className={styles.group}>
                                        <label>{domain === "TIME" ? "Description" : "Payee"}</label>
                                        <input
                                            type="text"
                                            value={entity}
                                            onChange={(e) => setEntity(e.target.value)}
                                            placeholder={domain === "TIME" ? "Short summary" : "Company, Person, etc."}
                                            required
                                            list="entity-suggestions"
                                        />
                                    </div>
                                )}

                                {tab === "INCOME" && (
                                    <div className={styles.group}>
                                        <label>Payer</label>
                                        <input
                                            type="text"
                                            value={entity}
                                            onChange={(e) => setEntity(e.target.value)}
                                            placeholder="Source of funds"
                                            required
                                            list="entity-suggestions"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.row}>
                                <div className={styles.group}>
                                    <label>Amount</label>
                                    <div className={`${styles.inputWithPrefix} ${domain === "MONEY" ? styles.hasPrefix : ""}`}>
                                        {domain === "MONEY" && (
                                            <span className={styles.prefix}>
                                                {SYMBOL_MAP[currency] || currency}
                                            </span>
                                        )}
                                        <input
                                            type="number"
                                            step={domain === "TIME" ? "0.1" : "0.01"}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            required
                                            placeholder={domain === "TIME" ? "e.g. 1.5" : "0.00"}
                                            readOnly={mode === "range" && tab === "EXPENSE"}
                                        />
                                    </div>
                                </div>
                            </div>



                            {/* Time Range - Specific to EXPENSE in TIME domain */}
                            {domain === "TIME" && tab === "EXPENSE" && (
                                <>
                                    <div className={styles.tabsSmall}>
                                        <button
                                            type="button"
                                            className={`${styles.tabSmall} ${mode === "duration" ? styles.activeTabSmall : ""}`}
                                            onClick={() => setMode("duration")}
                                        >
                                            Duration
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.tabSmall} ${mode === "range" ? styles.activeTabSmall : ""}`}
                                            onClick={() => setMode("range")}
                                        >
                                            Time Range
                                        </button>
                                    </div>

                                    {mode === "range" && (
                                        <div className={styles.row}>
                                            <div className={styles.group}>
                                                <label>Start</label>
                                                <input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className={styles.group}>
                                                <label>End</label>
                                                <input
                                                    type="time"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {tab === "EXPENSE" && domain === "MONEY" && (
                                <div className={styles.group}>
                                    <label>Check # (Optional)</label>
                                    <input
                                        type="text"
                                        value={refNumber}
                                        onChange={(e) => setRefNumber(e.target.value)}
                                        placeholder="1234"
                                    />
                                </div>
                            )}

                            <div className={styles.group}>
                                <label>Notes (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className={styles.actions}>
                                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Autocomplete Datalist */}
                <datalist id="entity-suggestions">
                    {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
            </div>
        </div>,
        document.body
    );
}
