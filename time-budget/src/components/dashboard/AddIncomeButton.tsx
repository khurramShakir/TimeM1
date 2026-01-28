"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlusCircle, Wallet } from "lucide-react";
import styles from "./AddIncomeButton.module.css";

export function AddIncomeButton({ periodId }: { periodId: number }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleClick = () => {
        const domain = pathname.includes("/dashboard/money") ? "MONEY" : "TIME";
        router.push(`/dashboard/fill?domain=${domain}`);
    };

    return (
        <button
            className={styles.triggerBtn}
            onClick={handleClick}
            title="Fill Envelopes / Add Income"
        >
            <Wallet size={20} />
            <span>Fill Envelopes</span>
        </button>
    );
}
