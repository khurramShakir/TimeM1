"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, PieChart, List, Settings } from "lucide-react";
import styles from "./MobileNav.module.css";

export function MobileNav() {
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

    // Don't show on the gateway page
    if (pathname === "/dashboard") return null;

    return (
        <div className={styles.mobileNav}>
            <div className={styles.navItems}>
                {navigation.map((item) => {
                    // Check if current path starts with the item href (ignoring query params)
                    // We split by '?' to compare just the path part
                    const itemPath = item.href.split('?')[0];
                    const isActive = pathname === itemPath;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
