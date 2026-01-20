"use client";

import React from "react";
import styles from "./EnvelopeCard.module.css";
import { LogTimeTrigger } from "@/components/transactions/LogTimeTrigger";
import { useRouter } from "next/navigation";
import { formatValue } from "@/lib/format";
import { getThemeColor, getLightColor, getTextColor } from "@/lib/colors";

interface EnvelopeProps {
    id: number;
    name: string;
    budgeted: number;
    spent: number;
    remaining: number;
    color?: string | null;
    domain?: string;
    currency?: string;
}

export function EnvelopeCard({ id, name, budgeted, spent, remaining, color, domain = "TIME", currency = "USD" }: EnvelopeProps) {
    const router = useRouter();

    // Handle card click for details
    const handleCardClick = () => {
        router.push(`/dashboard/${domain.toLowerCase()}/envelope/${id}`);
    };

    // Calculate progress percentage, capped at 100%
    const progress = Math.min((spent / budgeted) * 100, 100);

    // Determine colors
    const themeColor = getThemeColor(color);
    const lightBg = getLightColor(color);
    const textColor = getTextColor(color);

    // Fallback for "Over" state
    const cardStyle = {
        backgroundColor: remaining < 0 ? "#fee2e2" : lightBg,
        borderColor: remaining < 0 ? "#fecaca" : `${themeColor}40`, // 40 is 25% opacity
    };

    return (
        <div
            className={styles.card}
            onClick={handleCardClick}
            role="button"
            style={cardStyle}
            tabIndex={0}
        >
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <LogTimeTrigger
                        envelopes={[{ id, name }]}
                        initialEnvelopeId={id}
                        compact={true}
                        domain={domain}
                        themeColor={themeColor}
                        currency={currency}
                    />
                    <h3 className={styles.title}>{name}</h3>
                </div>
                <span className={styles.badge} style={{ pointerEvents: 'none', backgroundColor: '#ffffff', color: remaining < 0 ? '#991b1b' : textColor }}>
                    {formatValue(remaining, domain, currency)} {remaining >= 0 ? 'Left' : 'Over'}
                </span>
            </div>

            <div className={styles.stats}>
                <span>Spent: {formatValue(spent, domain, currency)}</span>
                <span className={styles.budgetValue} style={{ color: remaining < 0 ? '#991b1b' : textColor }}>{formatValue(budgeted, domain, currency)}</span>
            </div>

            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{
                        width: `${progress}%`,
                        backgroundColor: remaining < 0 ? "#ef4444" : themeColor
                    }}
                ></div>
            </div>
        </div>
    );
}
