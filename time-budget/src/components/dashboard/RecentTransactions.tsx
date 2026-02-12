"use client";

import React from "react";
import styles from "./RecentTransactions.module.css";
import { Card } from "@/components/ui/Card";
import { formatValue } from "@/lib/format";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";

interface Transaction {
    id: number;
    amount: number;
    description: string;
    date: Date | string;
    type: string;
    envelope: {
        id: number;
        name: string;
        color: string;
    };
}

interface RecentTransactionsProps {
    transactions: Transaction[];
    domain?: string;
    currency?: string;
}

export function RecentTransactions({ transactions, domain = "TIME", currency = "USD" }: RecentTransactionsProps) {
    if (!transactions || transactions.length === 0) {
        return (
            <Card title="Recent Activity" className={styles.card}>
                <div className={styles.empty}>No recent transactions</div>
            </Card>
        );
    }

    return (
        <Card
            title="Recent Activity"
            className={styles.card}
            action={
                <Link href={`/dashboard/${domain.toLowerCase()}/transactions`} className={styles.viewAll}>
                    View All <ArrowUpRight size={14} />
                </Link>
            }
        >
            <div className={styles.list} style={{ paddingTop: '0.25rem' }}>
                {transactions.map((t) => (
                    <div key={t.id} className={styles.item}>
                        <div className={styles.left}>
                            <div className={styles.avatar} style={{ backgroundColor: getAvatarColor(t.type) }}>
                                {getAvatarIcon(t.type)}
                            </div>
                            <div className={styles.details}>
                                <div className={styles.description}>{t.description || "Uncategorized"}</div>
                                <div className={styles.meta}>
                                    <span className={styles.date}>
                                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className={styles.dot}>•</span>
                                    <span className={styles.envelope}>{t.envelope?.name}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.amount} style={{ color: t.type === "INCOME" ? "#4d7c0f" : "var(--foreground)" }}>
                            {t.type === "INCOME" ? "+" : ""}{formatValue(t.amount, domain, currency)}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function getAvatarColor(type: string) {
    return "rgba(107, 114, 128, 0.1)"; // Consistent light gray for all
}

function getAvatarIcon(type: string) {
    const size = 18;
    const color = "#6b7280"; // Consistent neutral gray
    switch (type) {
        case "INCOME": return <ArrowDownLeft size={size} color={color} />;
        case "TRANSFER": return <ArrowLeftRight size={size} color={color} />;
        default: return <ArrowUpRight size={size} color={color} />; // EXPENSE
    }
}
