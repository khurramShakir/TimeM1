"use client";

import { useState } from "react";
import { LogTimeModal } from "./LogTimeModal";
import { Clock, Banknote, Plus } from "lucide-react";
import styles from "./LogTimeTrigger.module.css";

interface Envelope {
    id: number;
    name: string;
}

interface LogTimeTriggerProps {
    envelopes: Envelope[];
    initialEnvelopeId?: number;
    compact?: boolean;
    domain?: string;
    themeColor?: string; // Hex color to match parent card
    currency?: string;
}

export function LogTimeTrigger({
    envelopes,
    initialEnvelopeId,
    compact = false,
    domain = "TIME",
    themeColor,
    currency
}: LogTimeTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        setIsOpen(true);
    };

    const buttonStyle = themeColor ? { "--theme-color": themeColor } as React.CSSProperties : {};

    return (
        <>
            <button
                onClick={handleOpen}
                className={compact ? styles.iconBtn : styles.triggerBtn}
                title={domain === "TIME" ? "Log Time" : "Log Transaction"}
                style={buttonStyle}
            >
                <div className={styles.iconWrapper}>
                    {domain === "TIME" ? (
                        <Clock className={styles.icon} />
                    ) : (
                        <Banknote className={styles.icon} />
                    )}
                    <div className={styles.plusBadge}>
                        <Plus className={styles.plusIcon} />
                    </div>
                </div>
                {!compact && (domain === "TIME" ? "Log Time" : "Log Transaction")}
            </button>

            <LogTimeModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                envelopes={envelopes}
                initialEnvelopeId={initialEnvelopeId}
                domain={domain}
                currency={currency}
            />
        </>
    );
}
