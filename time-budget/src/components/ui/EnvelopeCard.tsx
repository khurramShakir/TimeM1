"use client";

import React from "react";
import styles from "./EnvelopeCard.module.css";
import { LogTimeTrigger } from "@/components/transactions/LogTimeTrigger";
import { useRouter } from "next/navigation";

interface EnvelopeProps {
    id: number;
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
    color?: string | null;
}

export function EnvelopeCard({ id, name, budgeted, spent, remaining, color }: EnvelopeProps) {
    const router = useRouter();

    // Handle card click for details
    const handleCardClick = () => {
        router.push(`/dashboard/envelope/${id}`);
    };

    // Calculate progress percentage, capped at 100%
    const progress = Math.min((spent / budgeted) * 100, 100);

    // Determine color variant
    let variant = "gray";
    if (color === "blue") variant = "blue";
    if (color === "purple") variant = "purple";
    if (color === "green") variant = "green";
    if (color === "red") variant = "red";
    if (remaining < 0) variant = "red";

    return (
        <div
            className={`${styles.card} ${styles[variant]}`}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
        >
            <div className={styles.header}>
                <div className="flex items-center justify-between w-full">
                    <h3 className={styles.title}>{name}</h3>
                    {/* Log Time Button - Compact Style */}
                    <LogTimeTrigger
                        envelopes={[{ id, name }]} // Contextual envelope list (just this one)
                        initialEnvelopeId={id}
                        compact={true}
                    />
                </div>
            </div>
            <div className={styles.badgeLine}>
                <span className={styles.badge}>
                    {Math.abs(remaining).toFixed(2)}h {remaining >= 0 ? 'Left' : 'Over'}
                </span>
            </div>
            <div className={styles.body}>
                <div className={styles.stats}>
                    <span>Spent: {spent.toFixed(2)}h</span>
                    <span className={styles.budgetValue}>{budgeted.toFixed(2)}h</span>
                </div>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
