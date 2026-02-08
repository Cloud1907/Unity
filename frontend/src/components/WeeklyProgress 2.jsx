import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, Target } from 'lucide-react';

const WeeklyProgress = ({ totalTasks = 0, activeTasks = 0, overdueTasks = 0, completionRate = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12"
        >
            {/* Progress Section */}
            <div className="w-full md:w-2/5 flex flex-col gap-3">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize tracking-wider">Haftalık İlerleme</span>
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionRate}%` }}
                            transition={{ duration: 1.2, ease: "circOut" }}
                            className="h-full bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                        />
                    </div>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 min-w-[3rem] text-right">%{completionRate}</span>
                </div>
            </div>

            {/* Stats Section */}
            <div className="w-full md:flex-1 grid grid-cols-3 gap-6 relative items-center">
                {/* Vertical Divider for Desktop */}
                <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-slate-100 dark:bg-slate-700/50" />

                <div className="text-center md:text-left pl-0 md:pl-10 space-y-0.5">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalTasks}</div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-gray-400 capitalize tracking-wide">Toplam Görev</div>
                </div>

                <div className="text-center md:text-left border-l border-slate-100 dark:border-slate-700/50 pl-4 md:pl-10 space-y-0.5">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{activeTasks}</div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-gray-400 capitalize tracking-wide">Devam Eden</div>
                </div>

                <div className="text-center md:text-left border-l border-slate-100 dark:border-slate-700/50 pl-4 md:pl-10 space-y-0.5">
                    <div className="text-2xl font-bold text-rose-500 dark:text-rose-400">{overdueTasks}</div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-gray-400 capitalize tracking-wide">Geciken</div>
                </div>
            </div>
        </motion.div>
    );
};

export default WeeklyProgress;
