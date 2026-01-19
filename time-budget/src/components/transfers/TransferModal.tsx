"use client";

import React, { useState } from "react";
import { transferBudget } from "@/lib/actions";
import styles from "./TransferModal.module.css";
import { ArrowDown } from "lucide-react";

interface Envelope {
    id: number;
    name: string;
    remaining: number;
}

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    envelopes: Envelope[];
    domain?: string;
}

import { formatValue } from "@/lib/format";

export function TransferModal({ isOpen, onClose, envelopes, domain = "TIME" }: TransferModalProps) {
    const [fromId, setFromId] = useState<number>(envelopes[0]?.id || 0);
    const [toId, setToId] = useState<number>(envelopes[1]?.id || envelopes[0]?.id || 0);
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                alert("Please enter a valid amount");
                setIsSubmitting(false);
                return;
            }

            if (fromId === toId) {
                alert("Cannot transfer to the same envelope");
                setIsSubmitting(false);
                return;
            }

            await transferBudget(Number(fromId), Number(toId), numAmount);
            onClose();
            setAmount(""); // Reset amount
        } catch (error) {
            console.error(error);
            alert("Failed to transfer budget");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>Transfer Budget</h2>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>From</label>
                        <div className={styles.inputWrapper}>
                            <select
                                value={fromId}
                                onChange={(e) => setFromId(Number(e.target.value))}
                                required
                            >
                                {envelopes.map(env => (
                                    <option key={env.id} value={env.id}>
                                        {env.name} ({formatValue(env.remaining, domain)} left)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.group}>
                        <label>To</label>
                        <div className={styles.inputWrapper}>
                            <select
                                value={toId}
                                onChange={(e) => setToId(Number(e.target.value))}
                                required
                            >
                                {envelopes.map(env => (
                                    <option key={env.id} value={env.id}>
                                        {env.name} ({formatValue(env.remaining, domain)} left)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.group}>
                        <label>Amount</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="number"
                                step={domain === "TIME" ? "0.1" : "0.01"}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                placeholder="0.00"
                            />
                            <span className={styles.suffix}>{domain === "TIME" ? "hours" : "USD"}</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                            {isSubmitting ? "Transferring..." : "Confirm Transfer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
