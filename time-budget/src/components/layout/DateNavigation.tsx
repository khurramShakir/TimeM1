"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./DateNavigation.module.css";

interface DateNavigationProps {
    currentDate: Date;
}

export function DateNavigation({ currentDate }: DateNavigationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const formatDateRange = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day;
        const sunday = new Date(start.setDate(diff));

        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);

        const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
        return `${sunday.toLocaleDateString(undefined, options)} - ${saturday.toLocaleDateString(undefined, options)}, ${saturday.getFullYear()}`;
    };

    const navigate = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        const dateStr = newDate.toISOString().split("T")[0];

        const params = new URLSearchParams(searchParams.toString());
        params.set("date", dateStr);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className={styles.navigation}>
            <button
                onClick={() => navigate(-7)}
                className={styles.navBtn}
                title="Previous Week"
            >
                <ChevronLeft size={20} />
            </button>

            <div className={styles.dateDisplay}>
                <Calendar size={18} className={styles.calendarIcon} />
                <span className={styles.rangeText}>{formatDateRange(currentDate)}</span>
            </div>

            <button
                onClick={() => navigate(7)}
                className={styles.navBtn}
                title="Next Week"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}
