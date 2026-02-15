import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import MobileTaskCard from './MobileTaskCard';
import { statuses } from '../constants/taskConstants';

const MobileBoardView = ({
    tasks,
    onTaskClick,
    onNewTaskClick,
    getStatusColor,
    getPriorityData,
    getAssignees,
    searchQuery,
    onSearchChange
}) => {

    return (
        <div className="flex-1 bg-gray-50 dark:bg-[#0f172a] h-full relative flex flex-col">
            
            {/* Sticky Search Header */}
            <div className="sticky top-0 z-20 bg-gray-50/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Görev ara..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <button className="w-11 h-11 flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm text-gray-500 dark:text-gray-400 active:scale-95 transition-transform">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
                            <Search size={24} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Görev bulunamadı</p>
                    </div>
                ) : (
                    // Group tasks by status
                    statuses.map(status => {
                        const statusTasks = tasks.filter(t => t.status === status.id);
                        if (statusTasks.length === 0) return null;

                        return (
                            <div key={status.id} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <div 
                                        className="w-2.5 h-2.5 rounded-full" 
                                        style={{ backgroundColor: status.color }}
                                    />
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                        {status.label}
                                    </h3>
                                    <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                        {statusTasks.length}
                                    </span>
                                </div>
                                
                                <div className="space-y-3">
                                    {statusTasks.map(task => (
                                        <MobileTaskCard
                                            key={task.id}
                                            task={task}
                                            onClick={onTaskClick}
                                            getStatusColor={getStatusColor}
                                            getPriorityData={getPriorityData}
                                            getAssignees={getAssignees}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Floating Action Button (FAB) Removed as per user request */}

        </div>
    );
};

export default MobileBoardView;
