"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Loader2, Play } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { onboardUserTemplate } from "@/lib/budget-actions";
import styles from "./OnboardingClient.module.css";

type Template = {
    id: string;
    name: string;
    defaultFundingMode: string;
    items: { envelopeName: string; amount: number }[];
};

interface Props {
    builtInTemplates: Template[];
    userTemplates: Template[];
}

export function OnboardingClient({ builtInTemplates, userTemplates }: Props) {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleContinue = async () => {
        if (!selectedId || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onboardUserTemplate(selectedId);
            // Wait a brief moment to ensure DB sync before redirect
            setTimeout(() => {
                router.push("/dashboard");
                router.refresh();
            }, 500);
        } catch (error) {
            console.error("Failed to set template:", error);
            alert("An error occurred while saving your template. Please try again.");
            setIsSubmitting(false);
        }
    };

    const allOptions = [...builtInTemplates, ...userTemplates];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Play size={32} />
                </div>
                <h1 className={styles.title}>Welcome to TimeM1</h1>
                <p className={styles.subtitle}>
                    To start managing your money, choose a budget template. This template will dictate your envelopes and how you distribute your income. You can always change or edit it later!
                </p>
            </div>

            <div className={styles.grid}>
                {allOptions.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className={`${styles.templateCard} ${selectedId === t.id ? styles.selected : ""}`}
                    >
                        {selectedId === t.id && (
                            <div className={styles.checkIcon}>
                                <CheckCircle2 size={24} className="fill-current bg-white rounded-full" />
                            </div>
                        )}
                        <h3 className={styles.cardTitle}>{t.name}</h3>
                        <p className={styles.cardSubtitle}>
                            {t.items.length} envelopes • Default: {t.defaultFundingMode}
                        </p>

                        <div style={{ width: '100%' }}>
                            <div className={styles.includesHeader}>Included Envelopes:</div>
                            {t.items.slice(0, 4).map((item, i) => (
                                <div key={i} className={styles.envelopeItem}>
                                    <span className={styles.envelopeName}>{item.envelopeName}</span>
                                    <span className={styles.envelopeAmount}>{item.amount > 0 ? formatCurrency(item.amount, "USD") : "Flex"}</span>
                                </div>
                            ))}
                            {t.items.length > 4 && (
                                <div className={styles.moreItems}>
                                    + {t.items.length - 4} more
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            <div className={styles.footer}>
                <span className={styles.footerNote}>
                    You can customize all amounts and envelopes in Settings.
                </span>
                <button
                    onClick={handleContinue}
                    disabled={!selectedId || isSubmitting}
                    className={styles.startBtn}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Setting up...
                        </>
                    ) : (
                        <>
                            Start Budgeting
                            <ChevronRight size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
