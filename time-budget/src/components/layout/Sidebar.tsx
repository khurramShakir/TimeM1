"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, PieChart, Settings, LogOut, Clock, List, Banknote, ArrowRight } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import styles from "./Sidebar.module.css";

export function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Determine the current domain prefix
    const isMoney = pathname.startsWith("/dashboard/money");
    const prefix = isMoney ? "/dashboard/money" : "/dashboard/time";

    // Enforce Domain Specific Periods
    const typeParam = isMoney ? "?type=MONTHLY" : ""; // Time defaults to Weekly implicitly

    const navigation = [
        { name: "Dashboard", href: `${prefix}${typeParam}`, icon: Home },
        { name: "Envelopes", href: `${prefix}/budget${typeParam}`, icon: PieChart },
        { name: "History", href: `${prefix}/transactions${typeParam}`, icon: List },
        { name: "Settings", href: `/dashboard/settings`, icon: Settings },
    ];

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                {isMoney ? (
                    <Banknote className="w-6 h-6 text-blue-600" />
                ) : (
                    <Clock className="w-6 h-6 text-[var(--primary)]" />
                )}
                <span className={styles.logoText}>{isMoney ? "MoneyBudget" : "TimeBudget"}</span>
            </div>

            <nav className={styles.nav}>
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.switchMode}>
                <Link href="/dashboard" className={styles.switchLink}>
                    <ArrowRight className="w-4 h-4" />
                    Switch Mode
                </Link>
            </div>

            <div className={styles.footer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                    <UserButton afterSignOutUrl="/" showName />
                </div>
            </div>
        </div>
    );
}
