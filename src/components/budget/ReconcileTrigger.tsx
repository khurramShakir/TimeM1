"use client";

import React, { useState } from "react";
import { ReconcileModal } from "./ReconcileModal";
import { Scale } from "lucide-react";
import styles from "../transfers/TransferTrigger.module.css"; // Reuse existing trigger styles

interface ReconcileTriggerProps {
    periodId: number;
    currentUnallocated: number;
    currency?: string;
}

export function ReconcileTrigger({ periodId, currentUnallocated, currency = "USD" }: ReconcileTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={styles.triggerBtn}
            >
                <Scale size={18} className={styles.icon} />
                Reconcile
            </button>

            <ReconcileModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                periodId={periodId}
                currentUnallocated={currentUnallocated}
                currency={currency}
            />
        </>
    );
}
