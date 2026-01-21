"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./PeriodToggle.module.css";

interface PeriodToggleProps {
    defaultType?: "WEEKLY" | "MONTHLY";
}

export function PeriodToggle({ defaultType = "WEEKLY" }: PeriodToggleProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentType = searchParams.get("type") || defaultType;

    const handleToggle = (type: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("type", type);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className={styles.toggleContainer}>
            <button
                className={`${styles.toggleBtn} ${currentType === "WEEKLY" ? styles.active : ""}`}
                onClick={() => handleToggle("WEEKLY")}
            >
                Weekly
            </button>
            <button
                className={`${styles.toggleBtn} ${currentType === "MONTHLY" ? styles.active : ""}`}
                onClick={() => handleToggle("MONTHLY")}
            >
                Monthly
            </button>
        </div>
    );
}
