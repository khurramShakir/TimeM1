"use client";

import React from "react";
import styles from "./EnvelopeCard.module.css";
import { LogTimeTrigger } from "@/components/transactions/LogTimeTrigger";
import { useRouter } from "next/navigation";
import { formatValue } from "@/lib/format";

interface EnvelopeProps {
    id: number;
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
    color?: string | null;
    domain?: string;
}

export function EnvelopeCard({ id, name, budgeted, spent, remaining, color, domain = "TIME" }: EnvelopeProps) {
    const router = useRouter();

    // Handle card click for details
    const handleCardClick = () => {
        router.push(`/dashboard/${domain.toLowerCase()}/envelope/${id}`);
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

    // Map variant to hex for LogTimeTrigger
    const hexColors: Record<string, string> = {
        blue: "#2563eb",
        purple: "#9333ea",
        green: "#16a34a",
        red: "#dc2626",
        gray: "#4b5563"
    };

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
                    {/* Log Time/Transaction Button - Compact Style */}
                    <LogTimeTrigger
                        envelopes={[{ id, name }]} // Contextual envelope list (just this one)
                        initialEnvelopeId={id}
                        compact={true}
                        domain={domain}
                        themeColor={hexColors[variant]}
                    />
                </div>
            </div>
            <div className={styles.badgeLine}>
                <span className={styles.badge}>
                    {formatValue(remaining, domain)} {remaining >= 0 ? 'Left' : 'Over'}
                </span>
            </div>
            <div className={styles.body}>
                <div className={styles.stats}>
                    <span>Spent: {formatValue(spent, domain)}</span>
                    <span className={styles.budgetValue}>{formatValue(budgeted, domain)}</span>
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
