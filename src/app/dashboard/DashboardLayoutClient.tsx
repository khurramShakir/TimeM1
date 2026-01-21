"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import styles from "./layout.module.css";
import { usePathname } from "next/navigation";

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isGateway = pathname === "/dashboard";

    return (
        <div className={styles.layout}>
            {/* Sidebar - Hidden on mobile and gateway page */}
            {!isGateway && (
                <div className={styles.sidebarContainer}>
                    <Sidebar />
                </div>
            )}

            {/* Main Content Area */}
            <main className={`${styles.main} ${isGateway ? styles.noSidebar : ""}`}>
                <div className={styles.container}>
                    {children}
                </div>
            </main>

            {/* Mobile Navigation - Only visible on small screens */}
            <MobileNav />
        </div>
    );
}
