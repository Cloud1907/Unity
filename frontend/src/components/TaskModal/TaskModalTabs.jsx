import React from 'react';
import { ListTodo, MessageSquare, Paperclip, History } from 'lucide-react';

export const TaskModalTabs = ({ activeSection, setActiveSection, subtaskCount, commentCount, fileCount }) => {
    const tabs = [
        { id: 'subtasks', icon: ListTodo, label: 'Alt Görevler', count: subtaskCount },
        { id: 'comments', icon: MessageSquare, label: 'Yorumlar', count: commentCount },
        { id: 'files', icon: Paperclip, label: 'Dosyalar', count: fileCount },
        { id: 'activity', icon: History, label: 'Geçmiş' }
    ];

    return (
        <div className="w-16 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center py-6 gap-2 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
            {tabs.map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group ${activeSection === item.id
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                        : 'text-slate-400 hover:bg-white hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                        }`}
                    title={item.label}
                >
                    <item.icon size={20} className="transition-transform group-hover:scale-110" />
                    {item.count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-950">
                            {item.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};
