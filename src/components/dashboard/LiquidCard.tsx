"use client";

import React from "react";
import styles from "./LiquidCard.module.css";
import { Card } from "@/components/ui/Card";

interface LiquidCardProps {
    label: string;
    value: number;
    unit: string;
    prefix?: string;
    threshold?: number; // Total capacity to calc percentage
}

export function LiquidCard({ label, value, unit, prefix = "", threshold = 100 }: LiquidCardProps) {
    // Determine Status
    // Determine Status Colors
    // Duller Palette:
    // Healthy: #7c9885 (Sage Green)
    // Warning: #d4a373 (Muted Bronze/Tan)
    // Danger: #e57373 (Muted Red)

    let statusColor = "#7c9885";
    if (value < 0) {
        statusColor = "#e57373";
    } else if (value < (threshold * 0.1)) {
        statusColor = "#d4a373";
    }

    // Determine Status Class for Text
    let statusClass = "healthy";
    if (value < 0) {
        statusClass = "danger";
    } else if (value < (threshold * 0.1)) {
        statusClass = "warning";
    }

    const formattedValue = Math.abs(value).toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });

    return (
        <Card className={styles.liquidCard}>
            <div className={styles.topBorder} style={{ backgroundColor: statusColor }} />
            <span className={styles.label}>{label}</span>
            <div className={styles.valueGroup}>
                {prefix && <span className={styles.unit}>{prefix}</span>}
                <span className={styles.value}>{formattedValue}</span>
                <span className={styles.unit}>{unit}</span>
            </div>
            {statusClass !== "healthy" && (
                <span className={`${styles.statusText} ${styles[`status_${statusClass}`]}`}>
                    {statusClass === "danger" ? "Over Budget!" : "Running Low"}
                </span>
            )}
        </Card>
    );
}
