"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createEnvelope, updateEnvelope, deleteEnvelope } from "@/lib/actions";
import EnvelopeModal from "./EnvelopeModal";
import { LogTimeModal } from "../transactions/LogTimeModal";
import { TransferTrigger } from "../transfers/TransferTrigger";
import styles from "./BudgetManager.module.css";
import { Trash2, Edit2, Plus, Clock } from "lucide-react";

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
    initialEnvelopes: Envelope[];
    currentDate: string; // Added to sync actions with viewed week
}

// Shared with BudgetChart for consistency
const COLOR_VALUES: Record<string, string> = {
    blue: "#dbeafe",   // Blue-100
    green: "#d1fae5",  // Green-100
    purple: "#f3e8ff", // Purple-100
    red: "#fee2e2",    // Red-100
    gray: "#f3f4f6",   // Gray-100
    default: "#cbd5e1"
};

export default function BudgetManager({ userId, initialEnvelopes, currentDate }: BudgetManagerProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEnvelope, setEditingEnvelope] = useState<Envelope | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Log Time Modal State
    const [logTimeEnvelopeId, setLogTimeEnvelopeId] = useState<number | null>(null);

    const handleCreate = async (data: { name: string; budgeted: number; color: string }) => {
        setIsSubmitting(true);
        try {
            await createEnvelope({ ...data, date: currentDate });
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
                    <h1 className={styles.title}>Budget Management</h1>
                    <p className={styles.subtitle}>Create and allocate your weekly time budget.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <TransferTrigger envelopes={initialEnvelopes.map(e => ({ id: e.id, name: e.name, remaining: Number(e.remaining) }))} />
                    <button onClick={openForCreate} className={styles.addButton}>
                        <Plus size={20} />
                        New Envelope
                    </button>
                </div>
            </div>

            <div className={styles.list}>
                <div className={styles.listHeader}>
                    <span className={styles.colName}>Name</span>
                    <span className={styles.colBudget}>Budget</span>
                    <span className={styles.colSpent}>Spent</span>
                    <span className={styles.colAction}>Actions</span>
                </div>

                {initialEnvelopes.length === 0 ? (
                    <div className={styles.emptyState}>
                        No envelopes found. Create one to start budgeting!
                    </div>
                ) : (
                    initialEnvelopes.map(env => (
                        <div key={env.id} className={styles.row}>
                            <div className={styles.colName}>
                                <div
                                    className={styles.colorSwatch}
                                    style={{ backgroundColor: COLOR_VALUES[env.color] || COLOR_VALUES.default }}
                                    title={`Color: ${env.color}`}
                                />
                                <span className={styles.nameText}>{env.name}</span>
                            </div>
                            <div className={styles.colBudget}>{Number(env.budgeted).toFixed(1)}h</div>
                            <div className={styles.colSpent}>{Number(env.spent).toFixed(1)}h</div>
                            <div className={styles.colAction}>
                                <button
                                    onClick={() => setLogTimeEnvelopeId(env.id)}
                                    className={styles.iconBtn}
                                    title="Log Time"
                                >
                                    <Clock size={20} />
                                </button>
                                <button onClick={() => openForEdit(env)} className={styles.iconBtn} title="Edit">
                                    <Edit2 size={20} />
                                </button>
                                <button onClick={() => handleDelete(env.id)} className={`${styles.iconBtn} ${styles.danger}`} title="Delete">
                                    <Trash2 size={20} />
                                </button>
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
            />

            <LogTimeModal
                isOpen={!!logTimeEnvelopeId}
                onClose={() => setLogTimeEnvelopeId(null)}
                envelopes={initialEnvelopes.map(e => ({ id: e.id, name: e.name }))}
                initialEnvelopeId={logTimeEnvelopeId || undefined}
            />
        </div>
    );
}
