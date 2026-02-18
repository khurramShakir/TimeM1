"use client";

import { useState } from "react";
import { LogTimeModalMockup } from "@/components/transactions/LogTimeModalMockup";

export function MockupWrapper() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
                Log Time (Mockup)
            </button>
            <LogTimeModalMockup isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
