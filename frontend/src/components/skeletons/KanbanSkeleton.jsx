import React from 'react';
import { Skeleton } from '../ui/skeleton';

export const KanbanSkeleton = () => {
    return (
        <div className="h-full overflow-x-auto p-6">
            <div className="flex gap-6 h-full min-w-max">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-80 flex-shrink-0 flex flex-col h-full bg-gray-50/50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-800/50">
                        {/* Column Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-6 w-8 rounded-full" />
                            </div>
                            <Skeleton className="h-1 w-full rounded-full" />
                        </div>

                        {/* Tasks */}
                        <div className="p-3 space-y-3 flex-1 overflow-y-hidden">
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className="p-4 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <Skeleton className="h-4 w-3/4 rounded" />
                                        <Skeleton className="h-6 w-6 rounded" />
                                    </div>
                                    <div className="flex gap-2 mb-3">
                                        <Skeleton className="h-5 w-16 rounded" />
                                        <Skeleton className="h-5 w-12 rounded" />
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex -space-x-1">
                                            <Skeleton className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-800" />
                                            <Skeleton className="h-6 w-6 rounded-full border-2 border-white dark:border-slate-800" />
                                        </div>
                                        <Skeleton className="h-4 w-12 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
