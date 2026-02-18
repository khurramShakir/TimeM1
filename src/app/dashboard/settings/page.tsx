"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { Palette, Clock, Banknote, Globe, Save, Loader2, User, ChevronLeft, RotateCcw } from "lucide-react";
import { getUserSettings, updateUserSettings, updateUserProfile } from "@/lib/actions";
import { usePreference } from "@/context/PreferenceContext";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Tab = "profile" | "general" | "appearance" | "time" | "money";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const { setFontFamily: setGlobalFont } = usePreference();
    const [settings, setSettings] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function load() {
            const data = await getUserSettings();
            setSettings(data);
        }
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage("");

        try {
            // Save Settings
            await updateUserSettings({
                currency: settings.currency,
                weekStart: Number(settings.weekStart),
                defaultDomain: settings.defaultDomain,
                defaultPeriod: settings.defaultPeriod,
                timeCapacity: Number(settings.timeCapacity),
                baseMoneyCapacity: Number(settings.baseMoneyCapacity),
                autoBudget: settings.autoBudget,
                fontFamily: settings.fontFamily
            });

            // Save Profile
            if (settings.user) {
                await updateUserProfile({
                    name: settings.user.name
                });
            }

            setMessage("Settings saved successfully!");
        } catch (error) {
            console.error(error);
            setMessage("Failed to save settings.");
        } finally {
            setIsSaving(false);
            // Clear message after 3 seconds
            setTimeout(() => setMessage(""), 3000);
        }
    };

    if (!settings) {
        return (
            <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 className={styles.spin} size={32} color="var(--primary)" />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className={styles.title}>Settings</h1>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "profile" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    <User size={18} /> Profile
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "general" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("general")}
                >
                    <Globe size={18} /> General
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "appearance" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("appearance")}
                >
                    <Palette size={18} /> Appearance
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "time" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("time")}
                >
                    <Clock size={18} /> Time
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "money" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("money")}
                >
                    <Banknote size={18} /> Money
                </button>
            </div>

            <form onSubmit={handleSave} className={styles.card}>
                {activeTab === "profile" && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Profile Details</h2>
                        <div className={styles.settingsGrid}>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Display Name</label>
                                    <p className={styles.hint}>Your name as seen in the app.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <input
                                        type="text"
                                        value={settings.user?.name || ""}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            user: settings.user
                                                ? { ...settings.user, name: e.target.value }
                                                : { name: e.target.value }
                                        })}
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Email Address</label>
                                    <p className={styles.hint}>Used for account identification.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <input
                                        type="email"
                                        value={settings.user?.email || ""}
                                        disabled
                                        className={styles.disabledInput}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === "general" && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>General Preferences</h2>

                        <div className={styles.settingsGrid}>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Default Domain</label>
                                    <p className={styles.hint}>Choose your primary dashboard.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <select
                                        value={settings.defaultDomain}
                                        onChange={(e) => setSettings({ ...settings, defaultDomain: e.target.value })}
                                    >
                                        <option value="TIME">Time Management</option>
                                        <option value="MONEY">Money Management</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Start of Week</label>
                                    <p className={styles.hint}>Affects weekly view calculations.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <select
                                        value={settings.weekStart}
                                        onChange={(e) => setSettings({ ...settings, weekStart: e.target.value })}
                                    >
                                        <option value={0}>Sunday</option>
                                        <option value={1}>Monday</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Default Period Type</label>
                                    <p className={styles.hint}>Your preferred budgeting cycle.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <select
                                        value={settings.defaultPeriod}
                                        onChange={(e) => setSettings({ ...settings, defaultPeriod: e.target.value })}
                                    >
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "appearance" && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Appearance</h2>
                            <button
                                type="button"
                                className={styles.resetBtn}
                                onClick={() => {
                                    const defaultFont = "var(--font-inter)";
                                    setSettings({ ...settings, fontFamily: defaultFont });
                                    setGlobalFont(defaultFont);
                                }}
                                title="Reset to default font"
                            >
                                <RotateCcw size={16} /> Reset Default
                            </button>
                        </div>

                        <div className={styles.settingsGrid}>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Font Family</label>
                                    <p className={styles.hint}>Choose your preferred application font.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <select
                                        value={settings.fontFamily || "var(--font-inter)"}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSettings({ ...settings, fontFamily: val });
                                            setGlobalFont(val);
                                        }}
                                    >
                                        <optgroup label="Sans-Serif">
                                            <option value="var(--font-inter)">Inter (App Default)</option>
                                            <option value="system-ui, -apple-system, sans-serif">System Sans</option>
                                            <option value="'Roboto', sans-serif">Roboto</option>
                                            <option value="'Open Sans', sans-serif">Open Sans</option>
                                        </optgroup>
                                        <optgroup label="Monospaced">
                                            <option value="var(--font-courier-prime)">Courier Prime (Theme Default)</option>
                                            <option value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">System Mono</option>
                                            <option value="'Roboto Mono', monospace">Roboto Mono</option>
                                            <option value="'Fira Code', monospace">Fira Code</option>
                                            <option value="'Courier New', Courier, monospace">Courier New</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === "time" && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Time Management</h2>

                        <div className={styles.settingsGrid}>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Weekly Capacity</label>
                                    <p className={styles.hint}>Total hours to budget per week (max 168).</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        max="168"
                                        value={settings.timeCapacity}
                                        onChange={(e) => setSettings({ ...settings, timeCapacity: e.target.value })}
                                        placeholder="168"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "money" && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Money Management</h2>

                        <div className={styles.settingsGrid}>
                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Currency Symbol</label>
                                    <p className={styles.hint}>Symbol used for monetary values.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <select
                                        value={settings.currency}
                                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    >
                                        <option value="USD">$ (USD)</option>
                                        <option value="EUR">€ (EUR)</option>
                                        <option value="GBP">£ (GBP)</option>
                                        <option value="JPY">¥ (JPY)</option>
                                        <option value="CAD">C$ (CAD)</option>
                                        <option value="AUD">A$ (AUD)</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Base Monthly Income</label>
                                    <p className={styles.hint}>Auto-fills your budget at the start of the month.</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={settings.baseMoneyCapacity !== undefined ? settings.baseMoneyCapacity : 0}
                                        onChange={(e) => setSettings({ ...settings, baseMoneyCapacity: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className={styles.group}>
                                <div className={styles.labelInfo}>
                                    <label>Auto-Budget Logic</label>
                                    <p className={styles.hint}>Copy values from previous month?</p>
                                </div>
                                <div className={styles.inputControl}>
                                    <label className={styles.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={settings.autoBudget !== false}
                                            onChange={(e) => setSettings({ ...settings, autoBudget: e.target.checked })}
                                        />
                                        <span className={styles.toggleSlider}></span>
                                        <span className={styles.toggleLabel}>
                                            {settings.autoBudget !== false ? "Yes" : "No (Zero-Based)"}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.actions}>
                    <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                        {isSaving ? <Loader2 className={styles.spin} size={20} /> : <Save size={20} />}
                        {isSaving ? "Saving..." : "Save Settings"}
                    </button>
                    {message && <span className={styles.message}>{message}</span>}
                </div>
            </form>
        </div>
    );
}
