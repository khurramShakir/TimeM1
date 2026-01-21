"use client";

import React, { useState } from "react";
import { TransferModal } from "./TransferModal";
import { ArrowLeftRight } from "lucide-react";
import styles from "./TransferTrigger.module.css";

interface Envelope {
    id: number;
    name: string;
    remaining: number;
}

export function TransferTrigger({ envelopes, domain = "TIME" }: { envelopes: Envelope[], domain?: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={styles.triggerBtn}
            >
                <ArrowLeftRight className={styles.icon} />
                Transfer
            </button>

            <TransferModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                envelopes={envelopes}
                domain={domain}
            />
        </>
    );
}
