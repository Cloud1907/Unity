import React from 'react';
import { Skeleton } from '../ui/skeleton';

export const TableSkeleton = () => {
    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                <div className="flex items-center px-4 py-3">
                    <Skeleton className="h-4 w-4 mr-4" /> {/* Checkbox */}
                    <div className="flex-1 grid grid-cols-6 gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <Skeleton className="h-4 w-4 mr-4" /> {/* Checkbox */}
                        <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-3 w-3 rounded-full" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-6 w-24 rounded-md" /> {/* Status */}
                            <Skeleton className="h-6 w-20 rounded-md" /> {/* Priority */}
                            <div className="flex -space-x-1">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-24" /> {/* Date */}
                            <Skeleton className="h-2 w-16 rounded-full" /> {/* Progress */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
