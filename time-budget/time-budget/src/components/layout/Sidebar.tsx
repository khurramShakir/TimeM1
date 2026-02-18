"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, PieChart, Settings, List, Banknote, Clock, ArrowRight, TrendingUp, Moon, Sun } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import styles from "./Sidebar.module.css";
import { useTheme } from "@/context/ThemeContext";
import React from "react";

export function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Determine the current domain prefix
    const isMoney = pathname.startsWith("/dashboard/money") || searchParams.get("domain") === "MONEY";
    const prefix = isMoney ? "/dashboard/money" : "/dashboard/time";

    // Enforce Domain Specific Periods
    const typeParam = isMoney ? "?type=MONTHLY" : ""; // Time defaults to Weekly implicitly

    const navigation = [
        { name: "Dashboard", href: `${prefix}${typeParam}`, icon: Home },
        { name: "Envelopes", href: `${prefix}/budget${typeParam}`, icon: PieChart },
        { name: "History", href: `${prefix}/transactions${typeParam}`, icon: List },
        { name: "Reports", href: `/dashboard/reports${isMoney ? "?domain=MONEY" : "?domain=TIME"}`, icon: TrendingUp },
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
                    <ThemeToggle />
                    <UserButton afterSignOutUrl="/" showName />
                </div>
            </div>
        </div>
    );
}

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            style={{
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-100)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--foreground)',
                minWidth: '32px',
                minHeight: '32px'
            }}
            title={`Switch to ${theme === 'default' ? 'PaperBanana' : 'Default'} Theme`}
        >
            {theme === 'default' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
    );
}
