"use client";

import React from "react";
import styles from "./EnvelopeCard.module.css";
import { LogTimeTrigger } from "@/components/transactions/LogTimeTrigger";
import { useRouter } from "next/navigation";
import { formatValue } from "@/lib/format";
import { getThemeColor, getLightColor, getTextColor, darkenHexColor } from "@/lib/colors";

interface EnvelopeProps {
    id: number;
    name: string;
    budgeted: number;
    funded: number;
    spent: number;
    remaining: number;
    color?: string | null;
    domain?: string;
    currency?: string;
    allEnvelopes?: { id: number; name: string; color?: string | null }[];
}



export function EnvelopeCard({ id, name, budgeted, funded, spent, remaining, color, domain = "TIME", currency = "USD", allEnvelopes }: EnvelopeProps) {
    const router = useRouter();

    // Handle card click for details
    const handleCardClick = () => {
        router.push(`/dashboard/${domain.toLowerCase()}/envelope/${id}`);
    };

    // Funding status (MONEY domain only)
    const isOverspent = remaining < 0;
    const isUnderfunded = domain === "MONEY" && funded < budgeted && budgeted > 0 && !isOverspent;
    const isFullyFunded = domain === "MONEY" && funded >= budgeted && !isOverspent;

    // Status indicator color: red=overspent, amber=underfunded, green=fully funded
    const getStatusColor = () => {
        if (isOverspent) return "#ef4444"; // Red
        if (isUnderfunded) return "#f59e0b"; // Amber
        if (isFullyFunded) return "#22c55e"; // Green
        return null; // No indicator for TIME or neutral states
    };
    const statusColor = getStatusColor();

    // Determine colors - always use envelope's theme color for background
    const themeColor = getThemeColor(color);
    const lightBg = getLightColor(color);
    const textColor = getTextColor(color);
    const darkThemeColor = darkenHexColor(themeColor, 30); // made slightly darker for better contrast

    // Calculate segment percentages based on max(budgeted, funded)
    // This ensures the bar scales to the largest value involved
    const maxVal = Math.max(budgeted, funded);
    const baseValue = maxVal > 0 ? maxVal : 1;

    const spentPercent = Math.min((spent / baseValue) * 100, 100);
    const fundedPercent = Math.min((funded / baseValue) * 100, 100);
    const budgetedPercent = Math.min((budgeted / baseValue) * 100, 100);

    // Segment 1: Spent (Dark) - always starts at 0
    // Segment 2: Available (Theme) - comes after spent, up to funded amount
    const availablePercent = Math.max(fundedPercent - spentPercent, 0);

    // Segment 3: Unfunded Gap (Striped) - comes after funded, up to budgeted amount
    // Only exists if Budgeted > Funded
    const unfundedPercent = budgeted > funded ? Math.max(budgetedPercent - fundedPercent, 0) : 0;

    // Card background: red only if overspent, otherwise use theme color
    const cardStyle = {
        backgroundColor: isOverspent ? "#fee2e2" : lightBg,
        borderColor: isOverspent ? "#fecaca" : `${themeColor}40`,
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
                        envelopes={allEnvelopes || [{ id, name }]}
                        initialEnvelopeId={id}
                        compact={true}
                        domain={domain}
                        themeColor={themeColor}
                        currency={currency}
                    />
                    <h3 className={styles.title}>{name}</h3>
                    {/* Status indicator circle for MONEY domain */}
                    {statusColor && (
                        <span
                            title={isOverspent ? "Overspent" : isUnderfunded ? "Underfunded" : "Fully Funded"}
                            style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: statusColor,
                                flexShrink: 0
                            }}
                        />
                    )}
                </div>
                <span className={styles.badge} style={{ pointerEvents: 'none', backgroundColor: '#ffffff', color: isOverspent ? '#991b1b' : textColor }}>
                    {formatValue(remaining, domain, currency)} {remaining >= 0 ? 'Left' : 'Over'}
                </span>
            </div>

            <div className={styles.stats}>
                <span>Spent: {formatValue(spent, domain, currency)}</span>
                <span className={styles.budgetValue} style={{ color: isOverspent ? '#991b1b' : textColor }}>
                    {formatValue(funded, domain, currency)} of {formatValue(budgeted, domain, currency)}
                </span>
            </div>

            {/* Multi-segment progress bar */}
            <div className={styles.progressBar}>
                {/* Spent segment (dark shade) */}
                {spentPercent > 0 && (
                    <div
                        className={`${styles.progressSegment} ${styles.progressSpent}`}
                        style={{
                            width: `${spentPercent}%`,
                            backgroundColor: isOverspent ? "#ef4444" : darkThemeColor
                        }}
                    />
                )}
                {/* Available segment (theme color - funded but not spent) */}
                {availablePercent > 0 && !isOverspent && (
                    <div
                        className={`${styles.progressSegment} ${styles.progressAvailable}`}
                        style={{
                            width: `${availablePercent}%`,
                            backgroundColor: themeColor
                        }}
                    />
                )}
                {/* Unfunded segment (striped gray - for MONEY only) */}
                {unfundedPercent > 0 && domain === "MONEY" && !isOverspent && (
                    <div
                        className={`${styles.progressSegment} ${styles.progressUnfunded}`}
                        style={{ width: `${unfundedPercent}%` }}
                    />
                )}
            </div>
        </div>
    );
}
