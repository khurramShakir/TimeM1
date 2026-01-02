"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, Settings, LogOut, Clock, List } from "lucide-react";
import styles from "./Sidebar.module.css";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Envelopes", href: "/dashboard/budget", icon: PieChart },
    { name: "History", href: "/dashboard/transactions", icon: List },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

import { UserButton } from "@clerk/nextjs";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <Clock className="w-6 h-6 text-[var(--primary)]" />
                <span className={styles.logoText}>TimeBudget</span>
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

            <div className={styles.footer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                    <UserButton afterSignOutUrl="/" showName />
                </div>
            </div>
        </div>
    );
}
