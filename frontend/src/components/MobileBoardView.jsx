import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import MobileTaskCard from './MobileTaskCard';

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

    // Group tasks by status for a more organized view (Optional, but nice for "Monday" feel)
    // For now, let's just render the flat list as per the "MainTable" logic passed down.

    return (
        <div className="flex-1 bg-gray-50 dark:bg-[#0f172a] h-full relative flex flex-col">

            {/* Mobile Toolbar (optional overlay if header is too complex) */}
            {/* For now, we rely on the main BoardHeader, but we might want a sticky search bar here if header scrolls away */}

            <div className="p-4 overflow-y-auto pb-24 space-y-4">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Search size={24} />
                        </div>
                        <p className="text-sm">Görev bulunamadı</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <MobileTaskCard
                            key={task.id}
                            task={task}
                            onClick={onTaskClick}
                            getStatusColor={getStatusColor}
                            getPriorityData={getPriorityData}
                            getAssignees={getAssignees}
                        />
                    ))
                )}
            </div>

            {/* Floating Action Button (FAB) */}
            <div className="absolute bottom-6 right-6 z-20">
                <button
                    onClick={onNewTaskClick}
                    className="w-14 h-14 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={28} />
                </button>
            </div>
        </div>
    );
};

export default MobileBoardView;
