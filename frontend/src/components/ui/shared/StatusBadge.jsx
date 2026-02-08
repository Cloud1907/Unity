import React from 'react';
import { cn } from '../../../lib/utils';

// Central Definition of Status Colors
export const STATUS_CONFIG = {
    todo: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        label: 'Başlanmadı'
    },
    working: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        label: 'Devam Ediyor'
    },
    review: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800',
        label: 'İncelemede'
    },
    done: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        label: 'Tamamlandı'
    },
    stuck: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        label: 'Takıldı'
    },
    // Subtask specific states (booleans mapped to keys)
    completed: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        label: 'Tamamlandı'
    },
    in_progress: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        label: 'Devam Ediyor'
    }
};

const StatusBadge = ({ status, className, isSubtask = false, isCompleted = false }) => {

    // Decide config key
    let configKey = 'todo';

    if (isSubtask) {
        configKey = isCompleted ? 'completed' : 'in_progress';
    } else {
        configKey = status || 'todo';
    }

    const config = STATUS_CONFIG[configKey] || STATUS_CONFIG.todo;

    return (
        <span
            className={cn(
                "px-2 py-0.5 rounded text-xs font-bold truncate border",
                config.bg,
                config.text,
                config.border,
                className
            )}
        >
            {config.label}
        </span>
    );
};

export default React.memo(StatusBadge);
