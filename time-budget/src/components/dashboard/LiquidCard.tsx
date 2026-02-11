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
    let status: "healthy" | "warning" | "danger" = "healthy";

    // Logic: 
    // < 0 = Danger (Overbooked)
    // < 10% of threshold = Warning (Running Low)
    // Else = Healthy

    if (value < 0) {
        status = "danger";
    } else if (value < (threshold * 0.1)) {
        status = "warning";
    }

    const formattedValue = Math.abs(value).toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });

    return (
        <Card className={`${styles.liquidCard} ${styles[status]}`}>
            <span className={styles.label}>{label}</span>
            <div className={styles.valueGroup}>
                {prefix && <span className={styles.unit}>{prefix}</span>}
                <span className={styles.value}>{formattedValue}</span>
                <span className={styles.unit}>{unit}</span>
            </div>
            {status !== "healthy" && (
                <span className={`${styles.statusText} ${styles[`status_${status}`]}`}>
                    {status === "danger" ? "Over Budget!" : "Running Low"}
                </span>
            )}
        </Card>
    );
}
