import React from 'react';
import { ListTodo, MessageSquare, Paperclip, Link, History, Settings } from 'lucide-react';

const TabsComponent = ({ activeSection, setActiveSection, subtaskCount, commentCount, fileCount, linkCount, isMobile }) => {
    const baseTabs = [
        { id: 'subtasks', icon: ListTodo, label: 'Alt Görevler', count: subtaskCount },
        { id: 'comments', icon: MessageSquare, label: 'Yorumlar', count: commentCount },
        { id: 'files', icon: Paperclip, label: 'Dosyalar', count: fileCount },
        { id: 'link', icon: Link, label: 'Bağlantı', count: linkCount },
        { id: 'activity', icon: History, label: 'Geçmiş' }
    ];

    // Mobile: add Properties tab
    const tabs = isMobile
        ? [...baseTabs, { id: 'properties', icon: Settings, label: 'Detaylar' }]
        : baseTabs;

    // ─── MOBILE: Horizontal scrollable bottom bar ───
    if (isMobile) {
        return (
            <div className="w-full shrink-0 bg-transparent px-2 pb-2">
                <div className="flex overflow-x-auto scrollbar-hide gap-1.5 p-0.5">
                    {tabs.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm shrink-0 border ${
                                activeSection === item.id
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md transform scale-[1.02]'
                                    : 'bg-white/50 text-slate-600 border-slate-200/50 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                        >
                            <item.icon size={13} strokeWidth={2.5} />
                            <span>{item.label}</span>
                            {item.count > 0 && (
                                <span className={`min-w-[16px] h-4 px-1 text-[9px] font-bold flex items-center justify-center rounded-full ml-0.5 ${
                                    activeSection === item.id
                                        ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ─── DESKTOP: Vertical icon rail ───
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

export const TaskModalTabs = React.memo(TabsComponent);
