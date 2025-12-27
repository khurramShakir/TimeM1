import { Sidebar } from "@/components/layout/Sidebar";
import styles from "./layout.module.css";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.layout}>
            {/* Sidebar - Hidden on mobile (TODO: Add mobile menu) */}
            <div className={styles.sidebarContainer}>
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <main className={styles.main}>
                <div className={styles.container}>
                    {children}
                </div>
            </main>
        </div>
    );
}
