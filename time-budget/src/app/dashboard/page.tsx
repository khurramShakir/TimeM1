"use client";

import Link from "next/link";
import { Clock, Banknote, ArrowRight } from "lucide-react";
import styles from "./page.module.css";

export default function DashboardGateway() {
    return (
        <div className={styles.gateway}>
            <header className={styles.header}>
                <h1>Welcome back!</h1>
                <p>What would you like to manage today?</p>
            </header>

            <div className={styles.grid}>
                <Link href="/dashboard/time" className={styles.card}>
                    <div className={`${styles.iconWrapper} ${styles.timeIcon}`}>
                        <Clock size={48} />
                    </div>
                    <div className={styles.cardContent}>
                        <h2>Manage Time</h2>
                        <p>Track your hours, budget your week, and optimize your schedule.</p>
                    </div>
                    <div className={styles.arrow}>
                        <ArrowRight />
                    </div>
                </Link>

                <Link href="/dashboard/money" className={styles.card}>
                    <div className={`${styles.iconWrapper} ${styles.moneyIcon}`}>
                        <Banknote size={48} />
                    </div>
                    <div className={styles.cardContent}>
                        <h2>Manage Money</h2>
                        <p>Budget your finances using the same envelope system for your actual cash.</p>
                    </div>
                    <div className={styles.arrow}>
                        <ArrowRight />
                    </div>
                </Link>
            </div>
        </div>
    );
}
