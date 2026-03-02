"use client";

import React, { useState } from "react";
import { ResetPeriodModal } from "./ResetPeriodModal";
import { RotateCcw } from "lucide-react";
import styles from "../transfers/TransferTrigger.module.css";

interface ResetTriggerProps {
    periodId: number;
}

export function ResetTrigger({ periodId }: ResetTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={styles.triggerBtn}
            >
                <RotateCcw size={18} className={styles.icon} />
                Reset Budget
            </button>

            <ResetPeriodModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                periodId={periodId}
            />
        </>
    );
}
