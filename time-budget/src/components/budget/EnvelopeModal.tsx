"use client";

import React, { useState, useEffect } from "react";
import styles from "./EnvelopeModal.module.css";

interface EnvelopeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; budgeted: number; color: string }) => Promise<void>;
    initialData?: { name: string; budgeted: number; color: string } | null;
    isSubmitting?: boolean;
    usedColors?: string[];
}

const COLORS = [
    { name: "Blue", value: "blue", hex: "#3b82f6" },
    { name: "Green", value: "green", hex: "#22c55e" },
    { name: "Purple", value: "purple", hex: "#a855f7" },
    { name: "Red", value: "red", hex: "#ef4444" },
    { name: "Gray", value: "gray", hex: "#6b7280" },
];

export default function EnvelopeModal({ isOpen, onClose, onSave, initialData, isSubmitting = false, usedColors = [] }: EnvelopeModalProps) {
    const [name, setName] = useState("");
    const [budgeted, setBudgeted] = useState("");
    const [color, setColor] = useState("blue");

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setBudgeted(initialData.budgeted.toString());
                setColor(initialData.color);
            } else {
                setName("");
                setBudgeted("");

                // Smart color selection: find first color not in usedColors
                const availableColor = COLORS.find(c => !usedColors.includes(c.value));
                if (availableColor) {
                    setColor(availableColor.value);
                } else {
                    // If all used, pick random or default to first
                    setColor(COLORS[0].value);
                }
            }
        }
    }, [isOpen, initialData, usedColors]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const budgetNum = parseFloat(budgeted);
        if (!name || isNaN(budgetNum)) return;

        await onSave({ name, budgeted: budgetNum, color });
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{initialData ? "Edit Envelope" : "New Envelope"}</h2>
                    <button onClick={onClose} className={styles.closeButton}>×</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Work"
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Budgeted Hours</label>
                        <input
                            type="number"
                            value={budgeted}
                            onChange={e => setBudgeted(e.target.value)}
                            placeholder="0.0"
                            step="0.1"
                            min="0"
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Color</label>
                        <div className={styles.colorGrid}>
                            {COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    className={`${styles.colorOption} ${color === c.value ? styles.selected : ""}`}
                                    style={{ backgroundColor: c.hex }}
                                    onClick={() => setColor(c.value)}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className={styles.saveBtn}>
                            {isSubmitting ? "Saving..." : "Save Envelope"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
