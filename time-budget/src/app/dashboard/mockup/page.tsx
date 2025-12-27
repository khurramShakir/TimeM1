"use client";

import React from "react";
import { Clock } from "lucide-react";
import styles from "./Mockup.module.css";
import { useRouter } from "next/navigation";

// Mockup Card Component
function EnvelopeCardMock({ name, onClick }: { name: string; onClick: () => void }) {
    const handleLogTime = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        alert(`This would open the Log Time Modal for '${name}' with default 1h.`);
    };

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.cardHeader}>
                <div>
                    <div className={styles.cardTitle}>{name}</div>
                    <div className="text-sm text-gray-500 mt-1">Spent: 2.50h</div>
                </div>
                <button className={styles.actionBtn} onClick={handleLogTime}>
                    <Clock className="w-3 h-3" />
                    Log Time
                </button>
            </div>
            <div className={styles.statusBadge}>37.50h Left</div>
            {/* Visual Progress Bar Mock */}
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "6%" }}></div>
            </div>
        </div>
    );
}

export default function DashboardMockup() {
    const router = useRouter();

    return (
        <div className={styles.page}>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                <p className="font-bold">Mockup Mode</p>
                <p>This is a prototype to demonstrate the new "Card Actions" and "Details View" flow.</p>
            </div>

            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Current Week</h1>
                    <p className={styles.subtitle}>Dec 1, 2025 - Week 1</p>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Remaining: </span>
                    <span className={styles.summaryValue}>165.50 Hours</span>
                </div>
            </header>

            <div className={styles.grid}>
                <EnvelopeCardMock name="Work" onClick={() => router.push("/dashboard/mockup/details")} />
                <EnvelopeCardMock name="Sleep" onClick={() => router.push("/dashboard/mockup/details")} />
                <EnvelopeCardMock name="Leisure" onClick={() => router.push("/dashboard/mockup/details")} />
            </div>
        </div>
    );
}
