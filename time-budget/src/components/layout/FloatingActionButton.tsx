"use client";

import { Plus } from "lucide-react";
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
            <button className={styles.fab} onClick={handleClick} aria-label="Add New">
                <Plus size={32} strokeWidth={2.5} />
            </button>
        </div>
    );
}
