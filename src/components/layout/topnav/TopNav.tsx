"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, PieChart, Settings, List, TrendingUp, Sun, Moon, Banknote, Clock } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { usePreference as useTheme } from "@/context/PreferenceContext";
import styles from "./TopNav.module.css";

export function TopNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { theme, toggleTheme } = useTheme();

    // Determine the current domain prefix (Match Sidebar logic)
    const isMoney = pathname.startsWith("/dashboard/money") || searchParams.get("domain") === "MONEY";
    const prefix = isMoney ? "/dashboard/money" : "/dashboard/time";
    const typeParam = isMoney ? "?type=MONTHLY" : "";

    const navigation = [
        { name: "Dashboard", href: `${prefix}${typeParam}`, icon: Home },
        { name: "Allocation Studio", href: `/dashboard/fill?domain=${isMoney ? "MONEY" : "TIME"}`, matchPath: "/dashboard/fill", icon: PieChart },
        { name: "History", href: `${prefix}/transactions${typeParam}`, icon: List },
        { name: "Reports", href: `/dashboard/reports${isMoney ? "?domain=MONEY" : "?domain=TIME"}`, icon: TrendingUp },
        { name: "Settings", href: `/dashboard/settings${isMoney ? "?domain=MONEY" : "?domain=TIME"}`, icon: Settings },
    ];

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <Link href="/dashboard" className={styles.logo}>
                    {isMoney ? (
                        <Banknote className="w-6 h-6 text-blue-500" />
                    ) : (
                        <Clock className="w-6 h-6 text-[var(--primary)]" />
                    )}
                    <span>{isMoney ? "MoneyBudget" : "TimeBudget"}</span>
                </Link>
            </div>

            <nav className={styles.nav}>
                {navigation.map((item) => {
                    // Match either exact base path or the manual matchPath if provided
                    const itemBasePath = item.href.split("?")[0];
                    const isActive = pathname === itemBasePath || (item.matchPath && pathname === item.matchPath);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`${styles.link} ${isActive ? styles.active : ""}`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.right}>
                <button
                    className={styles.themeToggle}
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'default' ? 'PaperBanana' : 'Default'} Key`}
                >
                    {theme === 'default' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <UserButton afterSignOutUrl="/" />
            </div>
        </header>
    );
}
