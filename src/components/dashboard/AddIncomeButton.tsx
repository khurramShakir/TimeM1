"use client";

import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import { addIncome } from "@/lib/actions";
import styles from "./AddIncomeButton.module.css";

export function AddIncomeButton({ periodId }: { periodId: number }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState("");

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount))) return;

        setIsLoading(true);
        try {
            await addIncome(periodId, Number(amount));
            setIsAdding(false);
            setAmount("");
        } catch (error) {
            console.error("Failed to add income", error);
            alert("Failed to add income");
        } finally {
            setIsLoading(false);
        }
    };

    if (isAdding) {
        return (
            <div className={styles.overlay} onClick={() => setIsAdding(false)}>
                <form
                    className={styles.modal}
                    onClick={e => e.stopPropagation()}
                    onSubmit={handleAdd}
                >
                    <h3>Add Extra Income</h3>
                    <p className={styles.hint}>Found some cash? Add it to your liquid pool.</p>

                    <div className={styles.inputGroup}>
                        <span className={styles.currencySymbol}>$</span>
                        <input
                            type="number"
                            step="0.01"
                            autoFocus
                            placeholder="0.00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={() => setIsAdding(false)} className={styles.cancelBtn}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading || !amount} className={styles.addBtn}>
                            {isLoading ? <Loader2 className={styles.spin} size={18} /> : "Add Funds"}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <button
            className={styles.triggerBtn}
            onClick={() => setIsAdding(true)}
            title="Add Extra Income"
        >
            <PlusCircle size={20} />
            <span>Add Income</span>
        </button>
    );
}
