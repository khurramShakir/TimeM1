"use client";

import { useState } from "react";
import { LogTimeModal } from "./LogTimeModal";
import { Clock } from "lucide-react";
import styles from "./LogTimeTrigger.module.css";

interface Envelope {
    id: number;
    name: string;
}

interface LogTimeTriggerProps {
    envelopes: Envelope[];
    initialEnvelopeId?: number;
    compact?: boolean; // New prop for card header style
}

export function LogTimeTrigger({ envelopes, initialEnvelopeId, compact = false }: LogTimeTriggerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        setIsOpen(true);
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className={compact ? styles.iconBtn : styles.triggerBtn}
                title="Log Time"
            >
                <Clock className={compact ? "w-4 h-4" : styles.icon} />
                {!compact && "Log Time"}
            </button>

            <LogTimeModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                envelopes={envelopes}
                initialEnvelopeId={initialEnvelopeId} // We need to update Modal too
            />
        </>
    );
}
