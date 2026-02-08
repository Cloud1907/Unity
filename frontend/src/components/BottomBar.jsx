import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Battery, Calendar, Clock, Monitor } from 'lucide-react';
import pkg from '../../package.json';

const BottomBar = () => {
    const [time, setTime] = useState(new Date());
    const [online, setOnline] = useState(navigator.onLine);

    useEffect(() => {
        // Clock tick
        const timer = setInterval(() => setTime(new Date()), 1000);

        // Online/Offline listeners
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(timer);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="h-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 select-none backdrop-blur-sm z-50 shrink-0">

            {/* Left: System Info */}
            <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-help" title="System Ready">
                    <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span>{online ? 'Sistem çevrimiçi' : 'Bağlantı yok'}</span>
                </div>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Center: Maybe copyright or minimal quote? */}
            <div className="hidden md:flex text-[10px] text-slate-300 dark:text-slate-600 tracking-widest font-semibold uppercase">
                Univera Task Management
            </div>

            {/* Right: Date & Time */}
            <div className="flex items-center gap-4 text-[10px] font-medium text-slate-600 dark:text-slate-300 font-mono">
                <div className="flex items-center gap-1.5" title="Network Status">
                    {online ? <Wifi size={12} className="text-slate-400" /> : <WifiOff size={12} className="text-red-500" />}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="opacity-50">|</span>
                    <span>{time.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                    <span className="w-10 text-center">{time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </div>
    );
};

export default BottomBar;
