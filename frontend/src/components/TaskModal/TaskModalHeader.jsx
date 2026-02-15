import React from 'react';
import { Layout, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

export const TaskModalHeader = ({ title, onTitleChange, onClose, isMobile }) => {
    return (
        <div className={`flex items-center justify-between shrink-0 ${
            isMobile ? 'h-14 px-4 bg-transparent' : 'h-16 px-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800'
        }`}>
            <div className="flex items-center gap-3 flex-1 mr-4">
                {isMobile ? (
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 rounded-full text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        aria-label="Geri"
                    >
                        <ArrowLeft size={22} />
                    </button>
                ) : (
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400">
                        <Layout size={18} />
                    </div>
                )}
                <input
                    value={title}
                    onChange={e => onTitleChange(e.target.value)}
                    className={`font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-400 ${
                        isMobile ? 'text-lg' : 'text-lg'
                    }`}
                    placeholder="Görev başlığı..."
                />
            </div>
            {/* Desktop: Kapat butonu | Mobile: Header'daki ← yeterli */}
            {!isMobile && (
                <div className="flex items-center gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 px-6"
                    >
                        Kapat
                    </Button>
                </div>
            )}
        </div>
    );
};
