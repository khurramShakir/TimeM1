"use client";

import { Plus, Wallet } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./FloatingActionButton.module.css";

export function FloatingActionButton() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Logic: Only show on specific dashboard pages
    const isTime = pathname.includes("/dashboard/time");
    const isMoney = pathname.includes("/dashboard/money");

    if (!isTime && !isMoney) return null;

    const handleClick = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (isTime) {
            params.set("action", "log_time");
        } else if (isMoney) {
            params.set("action", "add_transaction");
        }

        // Push new params without scrolling
        // We replace because we want to treat this as a modal state, not a deep navigation history
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className={styles.fabContainer}>
            {/* Secondary Action: Fill Envelopes */}
            <div className="flex flex-col gap-3 items-center">
                <button
                    className={`${styles.fab} ${styles.secondaryFab} w-10 h-10 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-2 border-emerald-600 mb-3`}
                    onClick={() => {
                        const domain = pathname.includes("/dashboard/money") ? "MONEY" : "TIME";
                        router.push(`/dashboard/fill?domain=${domain}`);
                    }}
                    aria-label="Fill Envelopes"
                    title="Fill / Add Funds"
                >
                    <Wallet size={18} strokeWidth={2.5} />
                </button>

                <button className={styles.fab} onClick={handleClick} aria-label="Add New">
                    <Plus size={32} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
