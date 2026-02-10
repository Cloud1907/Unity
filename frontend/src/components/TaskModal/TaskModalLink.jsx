import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, Save, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export const TaskModalLink = ({ taskData, onUpdate }) => {
    const [url, setUrl] = useState(taskData.taskUrl || '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setUrl(taskData.taskUrl || '');
    }, [taskData.taskUrl]);

    const handleSave = async () => {
        if (url === taskData.taskUrl) return;
        
        try {
            await onUpdate(taskData.id, { taskUrl: url }); // Note: Key should match backend DTO property or controller logic
            toast.success('Bağlantı kaydedildi');
            setIsEditing(false);
        } catch (error) {
            console.error('Link save error:', error);
            toast.error('Bağlantı kaydedilemedi');
        }
    };

    const copyToClipboard = () => {
        if (!url) return;
        navigator.clipboard.writeText(url);
        toast.success('Bağlantı kopyalandı');
    };

    const openLink = () => {
        if (!url) return;
        let validUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            validUrl = 'https://' + url;
        }
        window.open(validUrl, '_blank');
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <LinkIcon size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bağlantı</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Bu göreve ait harici bir bağlantı ekleyin</p>
                </div>
            </div>

            <div className="p-6 flex flex-col gap-6 flex-1 justify-center items-center">

                {/* Input Area */}
                <div className="w-full max-w-lg space-y-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Hedef URL
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setIsEditing(true);
                            }}
                            onBlur={() => {
                                // Optional: Auto-save on blur if validated?
                                // Better to rely on manual save to avoid accidental saves while typing
                            }}
                            placeholder="https://example.com/tasarim-dosyasi"
                            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                        />
                        {isEditing && (
                            <button
                                onClick={handleSave}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                                title="Kaydet"
                            >
                                <Save size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {taskData.taskUrl && !isEditing && (
                    <div className="flex items-center gap-3 w-full max-w-lg">
                        <button
                            onClick={openLink}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <ExternalLink size={18} />
                            <span>Bağlantıyı Aç</span>
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-xl transition-all"
                            title="Kopyala"
                        >
                            <Copy size={18} />
                        </button>
                    </div>
                )}

                 {!taskData.taskUrl && !url && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                             <LinkIcon size={32} className="opacity-50" />
                        </div>
                        <p className="text-sm text-slate-500">Henüz bir bağlantı eklenmemiş.</p>
                    </div>
                 )}

            </div>
        </div>
    );
};
