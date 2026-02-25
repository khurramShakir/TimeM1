"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Info, ChevronRight, Settings2 } from "lucide-react";
import { getBudgetTemplates, upsertBudgetTemplate, deleteBudgetTemplate, getAllEnvelopeNames } from "@/lib/budget-actions";
import styles from "./BudgetTemplateManager.module.css";
import { formatCurrency } from "@/lib/format";

interface TemplateItem {
    envelopeName: string;
    amount: number;
    fundingModeOverride: "ADD" | "RESET" | "INHERIT";
}

interface Template {
    id: string;
    name: string;
    domain: string;
    isAutoFillEnabled: boolean;
    defaultFundingMode: "ADD" | "RESET";
    items: TemplateItem[];
}

interface BudgetTemplateManagerProps {
    domain: string;
    currency: string;
}

export function BudgetTemplateManager({ domain, currency }: BudgetTemplateManagerProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [availableEnvelopes, setAvailableEnvelopes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [tData, envNames] = await Promise.all([
                    getBudgetTemplates(domain),
                    getAllEnvelopeNames(domain)
                ]);
                setTemplates(tData as any);
                setAvailableEnvelopes(envNames);
            } catch (error) {
                console.error("Failed to load templates:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [domain]);

    const handleCreateNew = () => {
        setEditingTemplate({
            id: "",
            name: "New Template",
            domain: domain,
            isAutoFillEnabled: false,
            defaultFundingMode: "ADD",
            items: []
        });
    };

    const handleSave = async () => {
        if (!editingTemplate) return;
        setIsSaving(true);
        try {
            await upsertBudgetTemplate({
                id: editingTemplate.id || undefined,
                name: editingTemplate.name,
                domain: editingTemplate.domain,
                isAutoFillEnabled: editingTemplate.isAutoFillEnabled,
                defaultFundingMode: editingTemplate.defaultFundingMode,
                items: editingTemplate.items
            });

            // Refresh list
            const updated = await getBudgetTemplates(domain);
            setTemplates(updated as any);
            setEditingTemplate(null);
        } catch (error) {
            console.error("Failed to save template:", error);
            alert("Error saving template.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            await deleteBudgetTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (error) {
            console.error("Failed to delete template:", error);
        }
    };

    const addItem = () => {
        if (!editingTemplate) return;
        setEditingTemplate({
            ...editingTemplate,
            items: [...editingTemplate.items, { envelopeName: availableEnvelopes[0] || "", amount: 0, fundingModeOverride: "INHERIT" }]
        });
    };

    const removeItem = (index: number) => {
        if (!editingTemplate) return;
        const newItems = [...editingTemplate.items];
        newItems.splice(index, 1);
        setEditingTemplate({ ...editingTemplate, items: newItems });
    };

    const updateItem = (index: number, updates: Partial<TemplateItem>) => {
        if (!editingTemplate) return;
        const newItems = [...editingTemplate.items];
        newItems[index] = { ...newItems[index], ...updates };
        setEditingTemplate({ ...editingTemplate, items: newItems });
    };

    if (loading) return <div className={styles.loading}><Loader2 className={styles.spin} /> Loading templates...</div>;

    if (editingTemplate) {
        return (
            <div className={styles.editor}>
                <div className={styles.editorHeader}>
                    <button className={styles.backBtn} onClick={() => setEditingTemplate(null)}>
                        <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back
                    </button>
                    <h2>{editingTemplate.id ? "Edit Template" : "New Template"}</h2>
                </div>

                <div className={styles.editorBody}>
                    <div className={styles.group}>
                        <label>Template Name</label>
                        <input
                            type="text"
                            value={editingTemplate.name}
                            onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                            placeholder="e.g., Monthly Paycheck"
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.group}>
                            <label>Default Funding Mode</label>
                            <select
                                value={editingTemplate.defaultFundingMode}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, defaultFundingMode: e.target.value as any })}
                            >
                                <option value="ADD">ADD (Accumulation)</option>
                                <option value="RESET">RESET (Fixed Target)</option>
                            </select>
                        </div>
                        <div className={styles.group} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <input
                                type="checkbox"
                                id="autoFill"
                                checked={editingTemplate.isAutoFillEnabled}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, isAutoFillEnabled: e.target.checked })}
                            />
                            <label htmlFor="autoFill" style={{ cursor: 'pointer' }}>Enabled for Auto-Fill</label>
                        </div>
                    </div>

                    <div className={styles.infoBox}>
                        <Info size={16} />
                        <p><strong>ADD:</strong> Transfers exactly the amount from Unallocated. <br />
                            <strong>RESET:</strong> Transfers the delta to reach the target amount.</p>
                    </div>

                    <div className={styles.itemsSection}>
                        <div className={styles.itemsHeader}>
                            <h3>Envelopes to Fill</h3>
                            <div className={styles.headerActions}>
                                <button className={styles.outlineBtnSmall} onClick={() => {
                                    if (!editingTemplate) return;
                                    const existing = editingTemplate.items.map(i => i.envelopeName);
                                    const missing = availableEnvelopes.filter(name => !existing.includes(name));
                                    setEditingTemplate({
                                        ...editingTemplate,
                                        items: [
                                            ...editingTemplate.items,
                                            ...missing.map(name => ({ envelopeName: name, amount: 0, fundingModeOverride: "INHERIT" as const }))
                                        ]
                                    });
                                }}>
                                    Add All Envelopes
                                </button>
                                <button className={styles.addBtn} onClick={addItem}>
                                    <Plus size={16} /> Add Envelope
                                </button>
                            </div>
                        </div>

                        <div className={styles.itemsList}>
                            {editingTemplate.items.map((item, idx) => (
                                <div key={idx} className={styles.itemRow}>
                                    <select
                                        className={styles.envSelect}
                                        value={item.envelopeName}
                                        onChange={(e) => updateItem(idx, { envelopeName: e.target.value })}
                                    >
                                        <option value="" disabled>Select Envelope</option>
                                        {availableEnvelopes.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                        {!availableEnvelopes.includes(item.envelopeName) && item.envelopeName && (
                                            <option value={item.envelopeName}>{item.envelopeName} (Previous)</option>
                                        )}
                                    </select>

                                    <div className={styles.amountInput}>
                                        <span>{currency === "USD" ? "$" : currency}</span>
                                        <input
                                            type="number"
                                            value={item.amount}
                                            onChange={(e) => updateItem(idx, { amount: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <select
                                        className={styles.modeSelect}
                                        value={item.fundingModeOverride}
                                        onChange={(e) => updateItem(idx, { fundingModeOverride: e.target.value as any })}
                                    >
                                        <option value="INHERIT">Inherit ({editingTemplate.defaultFundingMode})</option>
                                        <option value="ADD">ADD</option>
                                        <option value="RESET">RESET</option>
                                    </select>

                                    <button className={styles.deleteBtn} onClick={() => removeItem(idx)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {editingTemplate.items.length === 0 && (
                                <p className={styles.emptyItems}>No envelopes added to this template yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.editorFooter}>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className={styles.spin} size={18} /> : <Save size={18} />}
                        Save Template
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h2>Managed Templates</h2>
                    <p>Set up rules to automatically fund your envelopes when new income arrives.</p>
                </div>
                <button className={styles.createBtn} onClick={handleCreateNew}>
                    <Plus size={18} /> Create Template
                </button>
            </div>

            <div className={styles.templatesList}>
                {templates.map(t => (
                    <div key={t.id} className={styles.templateCard}>
                        <div className={styles.templateInfo}>
                            <div className={styles.templateTitleRow}>
                                <h3>{t.name}</h3>
                                {t.isAutoFillEnabled && <span className={styles.badge}>Auto-Fill On</span>}
                            </div>
                            <p>{t.items.length} envelopes • Default: {t.defaultFundingMode}</p>
                        </div>
                        <div className={styles.templateActions}>
                            <button className={styles.actionBtn} onClick={() => setEditingTemplate(t)}>
                                <Settings2 size={18} /> Edit
                            </button>
                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(t.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {templates.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>You haven't created any budget templates yet.</p>
                        <button className={styles.outlineBtn} onClick={handleCreateNew}>Get Started</button>
                    </div>
                )}
            </div>
        </div>
    );
}
