"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Info, ChevronRight, Settings2, CheckCircle2, Copy } from "lucide-react";
import { getBudgetTemplates, upsertBudgetTemplate, deleteBudgetTemplate, getAllEnvelopeNames, setActiveTemplate } from "@/lib/budget-actions";
import styles from "./BudgetTemplateManager.module.css";
import { formatCurrency } from "@/lib/format";

function getCurrencySymbol(currency: string): string {
    if (currency === "CAD") return "C$";
    try {
        const parts = new Intl.NumberFormat("en-US", { style: "currency", currency }).formatToParts(0);
        return parts.find(p => p.type === "currency")?.value ?? "$";
    } catch {
        return "$";
    }
}

interface TemplateItem {
    envelopeName: string;
    amount: number | string;
    fundingModeOverride: "ADD" | "RESET" | "INHERIT";
}

interface Template {
    id: string;
    name: string;
    domain: string;
    isAutoFillEnabled: boolean;
    isActive: boolean;
    isBuiltIn: boolean;
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
    const [isActivating, setIsActivating] = useState<string | null>(null);

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
            isActive: false,
            isBuiltIn: false,
            defaultFundingMode: "ADD",
            items: []
        });
    };

    const handleEditOrDuplicate = (t: Template) => {
        if (t.isBuiltIn) {
            // Duplicate it instead of editing
            setEditingTemplate({
                ...t,
                id: "", // Clear ID so it saves as new
                name: `${t.name} (Copy)`,
                isBuiltIn: false,
                isActive: false // Copies start as inactive
            });
        } else {
            setEditingTemplate(t);
        }
    };

    const handleMakeActive = async (id: string) => {
        setIsActivating(id);
        try {
            await setActiveTemplate(id);
            const updated = await getBudgetTemplates(domain);
            setTemplates(updated as any);
        } catch (error) {
            console.error("Failed to set active template:", error);
            alert("Error setting active template.");
        } finally {
            setIsActivating(null);
        }
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
                items: editingTemplate.items.map(i => ({
                    ...i,
                    amount: Number(i.amount) || 0
                }))
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
        const usedNames = new Set(editingTemplate.items.map(i => i.envelopeName));
        const firstUnused = availableEnvelopes.find(name => !usedNames.has(name)) || "";

        setEditingTemplate({
            ...editingTemplate,
            items: [...editingTemplate.items, { envelopeName: firstUnused, amount: "", fundingModeOverride: "INHERIT" }]
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
                        <Info size={18} className={styles.infoIcon} />
                        <p><strong>ADD:</strong> Transfers exactly the amount from Unallocated. <br />
                            <strong>TARGET:</strong> Reach a specific goal by sweeping excess or pulling missing funds.</p>
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
                                            ...missing.map(name => ({ envelopeName: name, amount: "", fundingModeOverride: "INHERIT" as const }))
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
                            {/* Datalist for envelope names */}
                            <datalist id="envelope-names">
                                {availableEnvelopes.map((name) => (
                                    <option key={name} value={name} />
                                ))}
                            </datalist>

                            {editingTemplate.items.map((item, idx) => (
                                <div key={idx} className={styles.itemRow}>
                                    <input
                                        className={styles.envSelect}
                                        type="text"
                                        list="envelope-names"
                                        placeholder="Envelope name"
                                        value={item.envelopeName}
                                        onChange={(e) => updateItem(idx, { envelopeName: e.target.value })}
                                        onBlur={(e) => {
                                            // Handle edge case where name is empty
                                            if (!e.target.value.trim()) {
                                                updateItem(idx, { envelopeName: "New Envelope" });
                                            }
                                        }}
                                    />

                                    <div className={styles.amountInput}>
                                        <span>{getCurrencySymbol(currency)}</span>
                                        <input
                                            type="number"
                                            value={item.amount}
                                            onChange={(e) => updateItem(idx, { amount: e.target.value })}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className={styles.modeToggle}>
                                        <button
                                            className={`${styles.toggleOption} ${item.fundingModeOverride === 'INHERIT' ? styles.active : ''}`}
                                            onClick={() => updateItem(idx, { fundingModeOverride: 'INHERIT' })}
                                            title={`Auto: Inherits default (${editingTemplate.defaultFundingMode})`}
                                        >
                                            AUTO
                                        </button>
                                        <button
                                            className={`${styles.toggleOption} ${item.fundingModeOverride === 'ADD' ? styles.active : ''}`}
                                            onClick={() => updateItem(idx, { fundingModeOverride: 'ADD' })}
                                            title="Add: Fixed addition"
                                        >
                                            ADD
                                        </button>
                                        <button
                                            className={`${styles.toggleOption} ${item.fundingModeOverride === 'RESET' ? styles.active : ''}`}
                                            onClick={() => updateItem(idx, { fundingModeOverride: 'RESET' })}
                                            title="Target: Reach goal"
                                        >
                                            TARGET
                                        </button>
                                    </div>

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

                {editingTemplate.items.length > 0 && (
                    <div className={styles.totalBar}>
                        <span>Total Budgeted</span>
                        <span className={styles.totalAmount}>
                            {formatCurrency(editingTemplate.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), currency)}
                        </span>
                    </div>
                )}

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
                    <div key={t.id} className={`${styles.templateCard} ${t.isActive ? styles.activeCard : ''}`}>
                        <div className={styles.templateInfo}>
                            <div className={styles.templateTitleRow}>
                                <h3>{t.name}</h3>
                                {t.isActive && <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>}
                                {t.isBuiltIn && <span className={`${styles.badge} ${styles.badgeBuiltIn}`}>Built-in</span>}
                                {t.isAutoFillEnabled && <span className={styles.badge}>Auto-Fill On</span>}
                            </div>
                            <p>{t.items.length} envelopes • Default: {t.defaultFundingMode}</p>
                        </div>
                        <div className={styles.templateActions}>
                            {!t.isActive && (
                                <button
                                    className={`${styles.actionBtn} ${styles.activateBtn}`}
                                    onClick={() => handleMakeActive(t.id)}
                                    disabled={isActivating === t.id}
                                >
                                    {isActivating === t.id ? <Loader2 size={16} className={styles.spin} /> : <CheckCircle2 size={16} />}
                                    Set Active
                                </button>
                            )}
                            <button className={styles.actionBtn} onClick={() => handleEditOrDuplicate(t)}>
                                {t.isBuiltIn ? <><Copy size={16} /> Duplicate</> : <><Settings2 size={16} /> Edit</>}
                            </button>
                            {!t.isBuiltIn && (
                                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(t.id)}>
                                    <Trash2 size={16} />
                                </button>
                            )}
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
