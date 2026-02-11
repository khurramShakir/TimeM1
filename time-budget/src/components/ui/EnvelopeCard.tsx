"use client";

import React from "react";
import styles from "./EnvelopeCard.module.css";
import { LogTimeTrigger } from "@/components/transactions/LogTimeTrigger";
import { useRouter } from "next/navigation";
import { formatValue } from "@/lib/format";
import { getThemeColor, getTextColor, darkenHexColor, desaturateColor } from "@/lib/colors";
import { Card } from "./Card";

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

    const handleCardClick = () => {
        router.push(`/dashboard/${domain.toLowerCase()}/envelope/${id}`);
    };

    // Status Logic
    const isOverspent = remaining < 0;
    const isUnderfunded = domain === "MONEY" && funded < budgeted && budgeted > 0 && !isOverspent;
    const isFullyFunded = domain === "MONEY" && funded >= budgeted && !isOverspent;

    const statusColor = isOverspent ? "#ef4444" : isUnderfunded ? "#f59e0b" : isFullyFunded ? "#22c55e" : null;

    // Colors - Muted Aesthetic
    const themeColor = getThemeColor(color);
    const mutedThemeColor = desaturateColor(themeColor, 0.6);
    const mutedDarkColor = desaturateColor(darkenHexColor(themeColor, 15), 0.7);
    const mutedOverspentColor = "#e57373"; // Muted coral/red

    // Progress Calculation
    const maxVal = Math.max(budgeted, funded);
    const baseValue = maxVal > 0 ? maxVal : 1;

    const spentPercent = Math.min((spent / baseValue) * 100, 100);
    const fundedPercent = Math.min((funded / baseValue) * 100, 100);
    const budgetedPercent = Math.min((budgeted / baseValue) * 100, 100);

    const availablePercent = Math.max(fundedPercent - spentPercent, 0);
    const unfundedPercent = budgeted > funded ? Math.max(budgetedPercent - fundedPercent, 0) : 0;

    return (
        <Card className={styles.envelopeCard}>
            <div className={styles.topBorder} style={{ backgroundColor: themeColor }} />
            <div onClick={handleCardClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '0.25rem' }}>
                <div className={styles.header}>
                    <div style={{ flex: 1 }}>
                        <div className={styles.titleRow}>
                            <LogTimeTrigger
                                envelopes={allEnvelopes || [{ id, name }]}
                                initialEnvelopeId={id}
                                compact={true}
                                domain={domain}
                                themeColor="#6b7280"
                                currency={currency}
                            />
                            <h3 className={styles.title}>{name}</h3>
                            {statusColor && (
                                <div className={styles.statusDot} style={{ backgroundColor: statusColor }} />
                            )}
                        </div>
                    </div>
                    <div className={styles.badge} style={{
                        backgroundColor: isOverspent ? '#fee2e2' : 'var(--surface-200)',
                        color: isOverspent ? '#991b1b' : 'var(--foreground)'
                    }}>
                        {formatValue(remaining, domain, currency)} {remaining >= 0 ? 'Left' : 'Over'}
                    </div>
                </div>

                <div className={styles.stats}>
                    <span className={styles.amountLarge}>
                        {formatValue(funded, domain, currency)}
                    </span>
                    <span className={styles.amountSmall}>
                        of {formatValue(budgeted, domain, currency)} Budgeted
                    </span>
                    {spent > 0 && (
                        <span className={styles.amountSmall} style={{ marginTop: '0.25rem', color: isOverspent ? mutedOverspentColor : '#666' }}>
                            {formatValue(spent, domain, currency)} Spent
                        </span>
                    )}
                </div>

                <div className={styles.progressBar}>
                    {spentPercent > 0 && (
                        <div
                            className={styles.progressSegment}
                            style={{
                                width: `${spentPercent}%`,
                                backgroundColor: isOverspent ? mutedOverspentColor : mutedDarkColor
                            }}
                        />
                    )}
                    {availablePercent > 0 && !isOverspent && (
                        <div
                            className={styles.progressSegment}
                            style={{
                                width: `${availablePercent}%`,
                                backgroundColor: mutedThemeColor
                            }}
                        />
                    )}
                    {unfundedPercent > 0 && domain === "MONEY" && !isOverspent && (
                        <div
                            className={`${styles.progressSegment} ${styles.progressUnfunded}`}
                            style={{ width: `${unfundedPercent}%` }}
                        />
                    )}
                </div>
            </div>
        </Card>
    );
}
