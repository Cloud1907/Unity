import React from 'react';
import { Layout } from 'lucide-react';
import { Button } from '../ui/button';

export const TaskModalHeader = ({ title, onTitleChange, onClose }) => {
    return (
        <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-950 shrink-0">
            <div className="flex items-center gap-3 flex-1 mr-4">
                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400">
                    <Layout size={18} />
                </div>
                <input
                    value={title}
                    onChange={e => onTitleChange(e.target.value)}
                    className="text-lg font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-400"
                    placeholder="Görev başlığı..."
                />
            </div>
            <div className="flex items-center gap-3">
                <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 px-6"
                >
                    Kapat
                </Button>
            </div>
        </div>
    );
};
