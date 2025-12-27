"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createTransaction, updateTransaction } from "@/lib/actions";
import styles from "./LogTimeModal.module.css";

interface Envelope {
    id: number;
    name: string;
}

interface LogTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    envelopes: Envelope[];
    initialEnvelopeId?: number;
    transaction?: {
        id: number;
        envelopeId: number;
        amount: number;
        description: string;
        date: Date;
        startTime?: Date | null;
        endTime?: Date | null;
    } | null;
}

type Mode = "duration" | "range";

export function LogTimeModal({ isOpen, onClose, envelopes, initialEnvelopeId, transaction }: LogTimeModalProps) {
    const [mode, setMode] = useState<Mode>("duration");
    const [envelopeId, setEnvelopeId] = useState<number>(envelopes[0]?.id || 0);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [amount, setAmount] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset or Populate form when opening
    useEffect(() => {
        if (isOpen) {
            if (transaction) {
                // EDIT MODE
                setMode(transaction.startTime && transaction.endTime ? "range" : "duration");
                setEnvelopeId(transaction.envelopeId);
                setDate(new Date(transaction.date).toISOString().split("T")[0]);
                setAmount(transaction.amount.toString());
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
                setMode("duration");
                setAmount("");
                setStartTime("");
                setEndTime("");
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
                envelopeId: Number(envelopeId),
                amount: numAmount,
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

    if (!isOpen) return null;

    // Use Portal to escape stacking context of parent Cards
    return createPortal(
        <div className={styles.overlay} onMouseDown={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                <h2 className={styles.title}>Log Time</h2>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        type="button"
                        className={`${styles.tab} ${mode === "duration" ? styles.activeTab : ""}`}
                        onClick={() => setMode("duration")}
                    >
                        Duration
                    </button>
                    <button
                        type="button"
                        className={`${styles.tab} ${mode === "range" ? styles.activeTab : ""}`}
                        onClick={() => setMode("range")}
                    >
                        Time Range
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Envelope</label>
                        <select
                            value={envelopeId}
                            onChange={(e) => setEnvelopeId(Number(e.target.value))}
                            required
                        >
                            {envelopes.map(env => (
                                <option key={env.id} value={env.id}>{env.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.group}>
                        <label>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    {mode === "duration" ? (
                        <div className={styles.group}>
                            <label>Hours</label>
                            <input
                                type="number"
                                step="0.1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                placeholder="e.g. 1.5"
                            />
                        </div>
                    ) : (
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
                            <div className={styles.group}>
                                <label>Total</label>
                                <input
                                    type="text"
                                    value={amount}
                                    readOnly
                                    className={styles.readOnly}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.group}>
                        <label>Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className={styles.actions}>
                        {/* Removed overlapping text, kept clean actions */}
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Log"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
