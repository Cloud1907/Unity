import React from 'react';
import { Skeleton } from '../ui/skeleton';

export const TableSkeleton = () => {
    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 h-10 flex items-center px-4">
                <Skeleton className="h-4 w-4 mr-4" />
                <div className="flex-1 grid grid-cols-6 gap-8">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>

            {/* Rows - Matched to actual task row height to prevent CLS */}
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="flex items-center px-4 h-[38px] transition-colors">
                        <Skeleton className="h-4 w-4 mr-4" />
                        <div className="flex-1 grid grid-cols-6 gap-8 items-center">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-3 w-3 rounded-full" />
                                <Skeleton className="h-3.5 w-48" />
                            </div>
                            <Skeleton className="h-5 w-20 rounded-md" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                            <div className="flex -space-x-1">
                                <Skeleton className="h-6 w-6 rounded-full border border-white dark:border-slate-900" />
                            </div>
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-1.5 w-12 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
