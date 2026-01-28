"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Settings, ArrowRightLeft, LogOut, X, TrendingUp } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import styles from "./MoreMenu.module.css";

export function MoreMenu() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const isOpen = searchParams.get("menu") === "more";

    const closeMenu = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("menu");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={closeMenu}>
            <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                <div className={styles.handle} />

                <h3 style={{ padding: '0 1rem', marginBottom: '1rem', fontWeight: 700 }}>More Actions</h3>

                {(() => {
                    const isMoney = pathname.startsWith("/dashboard/money") || searchParams.get("domain") === "MONEY";
                    return (
                        <Link href={`/dashboard/reports${isMoney ? "?domain=MONEY" : "?domain=TIME"}`} className={styles.menuItem} onClick={closeMenu}>
                            <div className={styles.menuItemIcon}>
                                <TrendingUp size={20} />
                            </div>
                            <span>Advanced Reports</span>
                        </Link>
                    );
                })()}

                <Link href="/dashboard/settings" className={styles.menuItem} onClick={closeMenu}>
                    <div className={styles.menuItemIcon}>
                        <Settings size={20} />
                    </div>
                    <span>App Settings</span>
                </Link>

                <Link href="/dashboard" className={styles.menuItem} onClick={closeMenu}>
                    <div className={styles.menuItemIcon}>
                        <ArrowRightLeft size={20} />
                    </div>
                    <span>Switch Mode (Time/Money)</span>
                </Link>

                <div className={styles.menuItem} style={{ padding: 0 }}>
                    <SignOutButton redirectUrl="/">
                        <button className={`${styles.menuItem} ${styles.signOutItem}`} style={{ background: 'transparent' }}>
                            <div className={styles.menuItemIcon}>
                                <LogOut size={20} />
                            </div>
                            <span>Sign Out</span>
                        </button>
                    </SignOutButton>
                </div>
            </div>
        </div>
    );
}
