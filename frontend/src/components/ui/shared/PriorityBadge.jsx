import React from 'react';
import { cn } from '../../../lib/utils';
import { ChevronUp, ChevronDown, Minus, ChevronsUp } from 'lucide-react';

export const PRIORITY_CONFIG = {
    urgent: {
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        label: 'Acil',
        icon: ChevronsUp
    },
    high: {
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        label: 'Yüksek',
        icon: ChevronUp
    },
    medium: {
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-50 dark:bg-slate-800/50',
        border: 'border-slate-200 dark:border-slate-700',
        label: 'Orta',
        icon: Minus
    },
    low: {
        color: 'text-slate-500 dark:text-slate-500',
        bg: 'bg-slate-50 dark:bg-slate-800/30',
        border: 'border-slate-100 dark:border-slate-800',
        label: 'Düşük',
        icon: ChevronDown
    }
};

const PriorityBadge = ({ priority, className, showIcon = true, showLabel = true }) => {
    const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
    const Icon = config.icon;

    return (
        <div
            className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide",
                config.bg,
                config.color,
                config.border,
                className
            )}
        >
            {showIcon && <Icon size={10} strokeWidth={3} />}
            {showLabel && <span>{config.label}</span>}
        </div>
    );
};

export default React.memo(PriorityBadge);
