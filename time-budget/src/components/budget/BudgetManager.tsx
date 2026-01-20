"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createEnvelope, updateEnvelope, deleteEnvelope, updatePeriodCapacity } from "@/lib/actions";
import EnvelopeModal from "./EnvelopeModal";
import { LogTimeTrigger } from "../transactions/LogTimeTrigger";
import { TransferTrigger } from "../transfers/TransferTrigger";
import styles from "./BudgetManager.module.css";
import { Trash2, Edit2, Plus, Info, Layers } from "lucide-react";

interface Envelope {
    id: number;
    name: string;
    budgeted: number; // Decimal passed as number/string
    spent: number;
    remaining: number;
    color: string;
}

interface BudgetManagerProps {
    userId: string;
    periodId: number;
    initialEnvelopes: Envelope[];
    initialCapacity: number;
    currentDate: string;
    domain?: string;
    currency?: string;
    periodType?: string;
}

// Shared with BudgetChart for consistency
import { getThemeColor, getLightColor, getTextColor } from "@/lib/colors";

export default function BudgetManager({
    userId,
    periodId,
    initialEnvelopes,
    initialCapacity,
    currentDate,
    domain = "TIME",
    currency = "$",
    periodType = "WEEKLY"
}: BudgetManagerProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEnvelope, setEditingEnvelope] = useState<Envelope | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [capacity, setCapacity] = useState(initialCapacity);
    const [isUpdatingCapacity, setIsUpdatingCapacity] = useState(false);

    const handleCapacityUpdate = async (val: string) => {
        const num = Number(val);
        if (isNaN(num)) return;
        setCapacity(num);
    };

    const submitCapacity = async () => {
        setIsUpdatingCapacity(true);
        try {
            await updatePeriodCapacity(periodId, capacity);
            router.refresh();
        } catch (error) {
            console.error("Failed to update capacity", error);
            alert("Failed to update capacity");
        } finally {
            setIsUpdatingCapacity(false);
        }
    };

    const handleCreate = async (data: { name: string; budgeted: number; color: string }) => {
        setIsSubmitting(true);
        try {
            await createEnvelope({ ...data, date: currentDate, domain, type: periodType });
            setIsModalOpen(false);
            router.refresh();
        } catch (error) {
            console.error("Failed to create envelope", error);
            alert("Failed to create envelope");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (data: { name: string; budgeted: number; color: string }) => {
        if (!editingEnvelope) return;
        setIsSubmitting(true);
        try {
            await updateEnvelope(editingEnvelope.id, data);
            setEditingEnvelope(null);
            setIsModalOpen(false);
            router.refresh();
        } catch (error) {
            console.error("Failed to update envelope", error);
            alert("Failed to update envelope");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this envelope?")) return;
        try {
            await deleteEnvelope(id);
            router.refresh();
        } catch (error) {
            console.error("Failed to delete envelope", error);
            alert("Failed to delete envelope");
        }
    };

    const openForCreate = () => {
        setEditingEnvelope(null);
        setIsModalOpen(true);
    };

    const openForEdit = (env: Envelope) => {
        setEditingEnvelope(env);
        setIsModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{domain === "TIME" ? "Time Budget" : "Money Budget"}</h1>
                    <div className={styles.capacityControl}>
                        <label className={styles.capacityLabel}>
                            {domain === "TIME" ? "Weekly Capacity (Hours):" : "Total Period Income:"}
                        </label>
                        <div className={styles.capacityInputWrapper}>
                            <input
                                type="number"
                                className={styles.capacityInput}
                                value={capacity}
                                onChange={(e) => handleCapacityUpdate(e.target.value)}
                                onBlur={submitCapacity}
                                step={domain === "TIME" ? "1" : "100"}
                            />
                            {isUpdatingCapacity && <div className={styles.updatingLoader} />}
                        </div>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <TransferTrigger envelopes={initialEnvelopes.map(e => ({ id: e.id, name: e.name, remaining: Number(e.remaining) }))} />
                    <button onClick={openForCreate} className={styles.addButton}>
                        <Plus size={20} />
                        New Envelope
                    </button>
                </div>
            </div>

            <div className={styles.list}>
                <div className={styles.listHeader}>
                    <div className={styles.colName}>
                        <div className={styles.triggerPlaceholder} />
                        <span>Envelope Name</span>
                    </div>
                    <div className={styles.colBudget}>{domain === "TIME" ? "Hours" : "Limit"}</div>
                    <div className={styles.colStatus}>Status / Progress</div>
                    <div className={styles.colAction}>Actions</div>
                </div>

                {initialEnvelopes.length === 0 ? (
                    <div className={styles.emptyState}>
                        No envelopes found. Create one to start budgeting!
                    </div>
                ) : (
                    [...initialEnvelopes]
                        .sort((a, b) => (a.name === "Unallocated" ? -1 : b.name === "Unallocated" ? 1 : a.name.localeCompare(b.name)))
                        .map(env => (
                            <div
                                key={env.id}
                                className={`${styles.row} ${env.name === "Unallocated" ? styles.unallocatedRow : ""}`}
                            >
                                <div className={styles.colName}>
                                    {env.name !== "Unallocated" ? (
                                        <LogTimeTrigger
                                            envelopes={[{ id: env.id, name: env.name }]}
                                            initialEnvelopeId={env.id}
                                            compact={true}
                                            domain={domain}
                                            themeColor={getThemeColor(env.color)}
                                            currency={currency}
                                        />
                                    ) : (
                                        <div className={styles.unallocatedIcon}>
                                            <Layers size={18} />
                                        </div>
                                    )}
                                    <span className={`${styles.nameText} ${env.name === "Unallocated" ? styles.unallocatedName : ""}`}>
                                        {env.name}
                                    </span>
                                </div>
                                <div className={styles.colBudget}>
                                    {domain === "TIME" ? `${Number(env.budgeted).toFixed(1)}h` : `${currency}${Number(env.budgeted).toLocaleString()}`}
                                </div>
                                <div className={styles.colStatus}>
                                    {(() => {
                                        const budgeted = Number(env.budgeted);
                                        const spent = Number(env.spent);
                                        const percent = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
                                        const isOver = spent > budgeted;
                                        const colorHex = isOver ? "#ef4444" : getThemeColor(env.color);

                                        return (
                                            <div className={styles.progressWrapper}>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{
                                                            width: `${percent}%`,
                                                            backgroundColor: isOver ? "#ef4444" : colorHex
                                                        }}
                                                    />
                                                </div>
                                                <div className={styles.spentText}>
                                                    {domain === "TIME"
                                                        ? `${spent.toFixed(1)}h used`
                                                        : `${currency}${spent.toLocaleString()} spent`}
                                                    {isOver && " (Over)"}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className={styles.colAction}>
                                    {env.name !== "Unallocated" ? (
                                        <>
                                            <button onClick={() => openForEdit(env)} className={styles.iconBtn} title="Edit">
                                                <Edit2 size={20} />
                                            </button>
                                            <button onClick={() => handleDelete(env.id)} className={`${styles.iconBtn} ${styles.danger}`} title="Delete">
                                                <Trash2 size={20} />
                                            </button>
                                        </>
                                    ) : (
                                        <span className={styles.managedTag}>Managed</span>
                                    )}
                                </div>
                            </div>
                        ))
                )}
            </div>

            <EnvelopeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={editingEnvelope ? handleUpdate : handleCreate}
                initialData={editingEnvelope ? {
                    name: editingEnvelope.name,
                    budgeted: Number(editingEnvelope.budgeted),
                    color: editingEnvelope.color
                } : null}
                isSubmitting={isSubmitting}
                usedColors={initialEnvelopes.map(e => e.color)}
                domain={domain}
                currency={currency}
            />
        </div>
    );
}
