import React, { useEffect, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Bell, Clock, Info, CheckCircle2 } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const NotificationPopover = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationsAPI.getAll();
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Bell size={14} className="text-indigo-600" />
                    Bildirimler
                </h3>
                <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Son aktiviteler
                </span>
            </div>

            <ScrollArea className="h-[300px]">
                {loading ? (
                    <div className="p-8 text-center text-slate-500 text-xs">Yükleniyor...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                        <CheckCircle2 size={24} className="text-slate-300" />
                        Yeni bildirim yok
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.map((notif) => (
                            <div key={notif.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex gap-3">
                                    <div className="mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-xs font-medium text-slate-900 dark:text-slate-200 leading-snug">
                                            {notif.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <Clock size={10} />
                                            <span>
                                                {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: tr })}
                                            </span>
                                            <span>•</span>
                                            <span className="uppercase tracking-wider font-semibold text-[9px]">{notif.entityName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Footer (Optional) */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
                <button onClick={fetchNotifications} className="text-[10px] text-indigo-600 font-medium hover:underline">
                    Yenile
                </button>
            </div>
        </div>
    );
};

export default NotificationPopover;
