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
    domain?: string;
    currency?: string;
}

const COLORS = [
    { name: "Blue", value: "blue", hex: "#3b82f6" },
    { name: "Green", value: "green", hex: "#22c55e" },
    { name: "Purple", value: "purple", hex: "#a855f7" },
    { name: "Red", value: "red", hex: "#ef4444" },
    { name: "Gray", value: "gray", hex: "#6b7280" },
    { name: "Orange", value: "orange", hex: "#f97316" },
    { name: "Pink", value: "pink", hex: "#ec4899" },
    { name: "Indigo", value: "indigo", hex: "#6366f1" },
];

export default function EnvelopeModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    isSubmitting = false,
    usedColors = [],
    domain = "TIME",
    currency = "$"
}: EnvelopeModalProps) {
    const [name, setName] = useState("");
    const [budgeted, setBudgeted] = useState("");
    const [color, setColor] = useState("blue");
    const [customColor, setCustomColor] = useState("#3b82f6");
    const [isCustom, setIsCustom] = useState(false);
    const [recentColors, setRecentColors] = useState<string[]>([]);

    // Load recent colors from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("recent_envelope_colors");
        if (saved) {
            try {
                setRecentColors(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent colors", e);
            }
        }
    }, []);

    // Helper to add/update recent colors
    const addToRecent = (newColor: string) => {
        if (!newColor.startsWith("#")) return;
        const updated = [newColor, ...recentColors.filter(c => c !== newColor)].slice(0, 5);
        setRecentColors(updated);
        localStorage.setItem("recent_envelope_colors", JSON.stringify(updated));
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setBudgeted(initialData.budgeted.toString());

                const isPreset = COLORS.some(c => c.value === initialData.color);
                if (isPreset) {
                    setColor(initialData.color);
                    setIsCustom(false);
                } else {
                    setColor(initialData.color);
                    setCustomColor(initialData.color);
                    setIsCustom(true);
                }
            } else {
                setName("");
                setBudgeted("");
                setIsCustom(false);

                // Smart color selection
                const availableColor = COLORS.find(c => !usedColors.includes(c.value));
                if (availableColor) {
                    setColor(availableColor.value);
                } else {
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
                        <label>{domain === "TIME" ? "Budgeted Hours" : "Budgeted Amount"}</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            {domain === "MONEY" && (
                                <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--foreground)', opacity: 0.6, fontWeight: 500, zIndex: 1, pointerEvents: 'none' }}>{currency}</span>
                            )}
                            <input
                                type="number"
                                value={budgeted}
                                onChange={e => setBudgeted(e.target.value)}
                                placeholder="0.0"
                                step={domain === "TIME" ? "0.1" : "0.01"}
                                min="0"
                                required
                                className={styles.input}
                                style={domain === "MONEY" ? { paddingLeft: '3rem' } : {}}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Color</label>
                        <div className={styles.colorGrid}>
                            {COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    className={`${styles.colorOption} ${!isCustom && color === c.value ? styles.selected : ""}`}
                                    style={{ backgroundColor: c.hex }}
                                    onClick={() => {
                                        setColor(c.value);
                                        setIsCustom(false);
                                    }}
                                    title={c.name}
                                />
                            ))}

                            {/* Render Recent Custom Colors */}
                            {recentColors.map((rc, idx) => (
                                <button
                                    key={`recent-${idx}`}
                                    type="button"
                                    className={`${styles.colorOption} ${isCustom && color === rc ? styles.selected : ""}`}
                                    style={{ backgroundColor: rc }}
                                    onClick={() => {
                                        setColor(rc);
                                        setCustomColor(rc);
                                        setIsCustom(true);
                                    }}
                                    title={`Recent Custom: ${rc}`}
                                />
                            ))}

                            <div className={styles.customColorWrapper}>
                                <input
                                    type="color"
                                    id="custom-color-picker"
                                    value={customColor}
                                    onChange={(e) => {
                                        const newColor = e.target.value;
                                        setCustomColor(newColor);
                                        setColor(newColor);
                                        setIsCustom(true);
                                        addToRecent(newColor);
                                    }}
                                    className={styles.colorPickerInput}
                                />
                                <label
                                    htmlFor="custom-color-picker"
                                    className={`${styles.colorOption} ${isCustom && !recentColors.includes(color) ? styles.selected : ""}`}
                                    style={{
                                        backgroundColor: isCustom ? customColor : "#f3f4f6",
                                        border: isCustom ? "none" : "2px dashed #cbd5e1",
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                    title="New Custom Color"
                                >
                                    {(isCustom && !recentColors.includes(color)) ? (
                                        <span style={{ color: 'white', fontWeight: 'bold' }}>✓</span>
                                    ) : (
                                        <span style={{ color: '#64748b', fontSize: '1.25rem', fontWeight: 'bold' }}>+</span>
                                    )}
                                </label>
                            </div>
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
