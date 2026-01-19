"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./DateNavigation.module.css";

interface DateNavigationProps {
    currentDate: Date;
    periodType?: string;
}

export function DateNavigation({ currentDate, periodType = "WEEKLY" }: DateNavigationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const formatDateRange = (date: Date) => {
        const start = new Date(date);

        if (periodType === "MONTHLY") {
            return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
        }

        const day = start.getDay();
        const diff = start.getDate() - day;
        const sunday = new Date(start.setDate(diff));

        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);

        const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
        return `${sunday.toLocaleDateString(undefined, options)} - ${saturday.toLocaleDateString(undefined, options)}, ${saturday.getFullYear()}`;
    };

    const navigate = (amount: number) => {
        const newDate = new Date(currentDate);
        if (periodType === "MONTHLY") {
            newDate.setMonth(newDate.getMonth() + amount);
        } else {
            newDate.setDate(newDate.getDate() + (amount * 7));
        }
        const dateStr = newDate.toISOString().split("T")[0];

        const params = new URLSearchParams(searchParams.toString());
        params.set("date", dateStr);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className={styles.navigation}>
            <button
                onClick={() => navigate(-1)}
                className={styles.navBtn}
                title={periodType === "MONTHLY" ? "Previous Month" : "Previous Week"}
            >
                <ChevronLeft size={20} />
            </button>

            <div className={styles.dateDisplay}>
                <Calendar size={18} className={styles.calendarIcon} />
                <span className={styles.rangeText}>{formatDateRange(currentDate)}</span>
            </div>

            <button
                onClick={() => navigate(1)}
                className={styles.navBtn}
                title={periodType === "MONTHLY" ? "Next Month" : "Next Week"}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}
