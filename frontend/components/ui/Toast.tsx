'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        // Defer state update to avoid "update during render" conflicts
        setTimeout(() => {
            const id = Math.random().toString(36).substring(2, 9);
            setToasts((prev) => [...prev, { id, message, type }]);

            // Auto dismiss
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3000);
        }, 0);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
    const icons = {
        success: <CheckCircle size={18} className="text-emerald-400" />,
        error: <AlertCircle size={18} className="text-red-400" />,
        warning: <AlertTriangle size={18} className="text-orange-400" />,
        info: <Info size={18} className="text-blue-400" />,
    };

    const borders = {
        success: 'border-emerald-500/20 bg-emerald-950/90 shadow-emerald-900/20',
        error: 'border-red-500/20 bg-red-950/90 shadow-red-900/20',
        warning: 'border-orange-500/20 bg-orange-950/90 shadow-orange-900/20',
        info: 'border-slate-700 bg-slate-900/90 shadow-slate-900/20',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            layout
            className={`pointer-events-auto flex min-w-[300px] items-center gap-3 rounded-lg border p-4 shadow-xl backdrop-blur-md ${borders[toast.type]}`}
        >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-medium text-slate-200">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-slate-500 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};
