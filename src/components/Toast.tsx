"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useStore } from "@/store";

const iconMap = {
    success: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
    error: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
    info: <Info size={18} className="text-blue-500 flex-shrink-0" />,
};

const bgMap = {
    success: "border-green-200 bg-green-50",
    error: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50",
};

export default function Toast() {
    const toasts = useStore((s) => s.toasts);
    const removeToast = useStore((s) => s.removeToast);

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onRemove={() => removeToast(toast.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({
    toast,
    onRemove,
}: {
    toast: { id: string; type: "success" | "error" | "info"; message: string; duration: number };
    onRemove: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(onRemove, toast.duration);
        return () => clearTimeout(timer);
    }, [toast.duration, onRemove]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgMap[toast.type]}`}
        >
            {iconMap[toast.type]}
            <p className="text-sm text-gray-800 flex-1 leading-snug">{toast.message}</p>
            <button
                onClick={onRemove}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}
