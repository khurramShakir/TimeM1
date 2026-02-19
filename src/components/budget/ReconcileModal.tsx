"use client";

import React, { useState } from "react";
import { X, Scale, Info, Loader2, CheckCircle2 } from "lucide-react";
import { cleanSlate } from "@/lib/budget-actions";
import styles from "./ReconcileModal.module.css";

interface ReconcileModalProps {
    periodId: number;
    currentUnallocated: number;
    isOpen: boolean;
    onClose: () => void;
    currency: string;
}

export function ReconcileModal({ periodId, currentUnallocated, isOpen, onClose, currency }: ReconcileModalProps) {
    const [actualBalance, setActualBalance] = useState<string>(currentUnallocated.toFixed(2));
    const [clearDebt, setClearDebt] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);

    if (!isOpen) return null;

    const delta = parseFloat(actualBalance) - currentUnallocated;

    const handleExecute = async () => {
        setIsProcessing(true);
        try {
            await cleanSlate(periodId, parseFloat(actualBalance), clearDebt);
            setCompleted(true);
            setTimeout(() => {
                onClose();
                setCompleted(false);
            }, 2000);
        } catch (error) {
            console.error("Reconciliation failed:", error);
            alert("Failed to reconcile. Check console for details.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <Scale size={20} className={styles.icon} />
                        <h2>Clean Slate Reconciliation</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {completed ? (
                    <div className={styles.completed}>
                        <CheckCircle2 size={48} className={styles.doneIcon} />
                        <h3>Balance Reconciled!</h3>
                        <p>Your "Unallocated" balance has been updated to match reality.</p>
                    </div>
                ) : (
                    <div className={styles.body}>
                        <div className={styles.section}>
                            <div className={styles.labelInfo}>
                                <label>Step 1: Clear Negative Envelopes</label>
                                <p className={styles.hint}>Move funds from Unallocated to cover overspent envelopes.</p>
                            </div>
                            <div className={styles.toggleRow}>
                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={clearDebt}
                                        onChange={(e) => setClearDebt(e.target.checked)}
                                    />
                                    <span className={styles.toggleSlider}></span>
                                    <span className={styles.toggleLabel}>{clearDebt ? "Enabled" : "Disabled"}</span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.labelInfo}>
                                <label>Step 2: Sync Unallocated Balance</label>
                                <p className={styles.hint}>What is your actual available cash today?</p>
                            </div>
                            <div className={styles.inputGroup}>
                                <span className={styles.currencyPrefix}>{currency === "USD" ? "$" : currency}</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={actualBalance}
                                    onChange={(e) => setActualBalance(e.target.value)}
                                    className={styles.balanceInput}
                                />
                            </div>

                            <div className={styles.mathPreview}>
                                <div className={styles.mathLine}>
                                    <span>Current Ledger:</span>
                                    <span>{currency === "USD" ? "$" : currency} {currentUnallocated.toFixed(2)}</span>
                                </div>
                                <div className={styles.mathLine}>
                                    <span>Actual Cash:</span>
                                    <span>{currency === "USD" ? "$" : currency} {parseFloat(actualBalance || "0").toFixed(2)}</span>
                                </div>
                                <div className={`${styles.mathLine} ${styles.total}`}>
                                    <span>Adjustment:</span>
                                    <span className={delta >= 0 ? styles.positive : styles.negative}>
                                        {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.infoBox}>
                            <Info size={16} />
                            <p>This will create a <strong>System Adjustment</strong> transaction. These are ignored by Income/Expense reports to keep your data clean.</p>
                        </div>

                        <div className={styles.footer}>
                            <button className={styles.cancelBtn} onClick={onClose} disabled={isProcessing}>
                                Cancel
                            </button>
                            <button className={styles.confirmBtn} onClick={handleExecute} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className={styles.spin} size={18} /> : "Finalize Reconciliation"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
