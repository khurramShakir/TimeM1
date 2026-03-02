"use client";

import React, { useState } from "react";
import { X, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { resetBudgetPeriodAction } from "@/lib/budget-actions";
import styles from "./ResetPeriodModal.module.css";

interface ResetPeriodModalProps {
    periodId: number;
    isOpen: boolean;
    onClose: () => void;
}

export function ResetPeriodModal({ periodId, isOpen, onClose }: ResetPeriodModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleExecute = async () => {
        setIsProcessing(true);
        try {
            await resetBudgetPeriodAction(periodId);
            onClose();
        } catch (error: any) {
            console.error("Reset failed:", error);
            const msg = error?.message || (typeof error === 'string' ? error : "Failed to reset budget period.");
            alert(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <RotateCcw size={20} className={styles.icon} />
                        <h2>Emergency Reset</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} disabled={isProcessing}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.body}>
                    <div className={styles.warningBox}>
                        <AlertTriangle size={24} className={styles.warningIcon} />
                        <div className={styles.warningText}>
                            <h3>This action will:</h3>
                            <ul>
                                <li>Sweep 100% of unspent funds from all envelopes back into <b>Unallocated</b>.</li>
                                <li>Delete empty envelopes from your dashboard if they aren't in your Active Template.</li>
                                <li>Immediately re-distribute funds according to your Active Template.</li>
                            </ul>
                            <p><strong>Note:</strong> Transaction history (spent money) is preserved safely!</p>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button className={styles.cancelBtn} onClick={onClose} disabled={isProcessing}>
                            Cancel
                        </button>
                        <button className={styles.confirmBtn} onClick={handleExecute} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className={styles.spin} size={18} /> : "Reset Budget"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
