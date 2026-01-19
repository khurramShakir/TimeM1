"use client";

import React from "react";
import { Clock, ArrowLeft } from "lucide-react";
import styles from "../Mockup.module.css";

// --- Mock Data ---
const MOCK_TRANSACTIONS = [
    { id: 1, date: "2025-12-08", amount: 1.5, description: "Morning session" },
    { id: 2, date: "2025-12-07", amount: 2.0, description: "Deep work" },
];

export default function DetailsMockup() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="flex items-center gap-4">
                    {/* Back Button */}
                    <a href="/dashboard/mockup" className={styles.backBtn}>
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </a>
                    <div>
                        <h1 className={styles.title}>Work</h1>
                        <p className={styles.subtitle}>Transaction History - Week 1</p>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Remaining: </span>
                    <span className={styles.summaryValue}>37.50 Hours</span>
                </div>
            </header>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th className="text-right">Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_TRANSACTIONS.map(t => (
                            <tr key={t.id}>
                                <td>{t.date}</td>
                                <td>{t.description}</td>
                                <td className="text-right font-bold">{t.amount.toFixed(2)}h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
