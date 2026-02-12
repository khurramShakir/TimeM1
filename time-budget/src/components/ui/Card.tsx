
import React from "react";
import styles from "./Card.module.css";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

export function Card({ children, className = "", title, action }: CardProps) {
    return (
        <div className={`${styles.card} ${className}`}>
            {(title || action) && (
                <div className={styles.header}>
                    {title && <h3 className={styles.title}>{title}</h3>}
                    {action && <div className={styles.action}>{action}</div>}
                </div>
            )}
            <div className={`${styles.content} ${!(title || action) ? styles.noHeader : ""}`}>
                {children}
            </div>
        </div>
    );
}
