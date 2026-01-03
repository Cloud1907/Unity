import React from 'react';
import { Calendar, GitMerge, MessageSquare, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

const MobileTaskCard = ({ task, onClick, getStatusColor, getPriorityData, getAssignees }) => {
    const statusColor = getStatusColor(task.status);
    const priorityData = getPriorityData(task.priority);
    const assignees = getAssignees(task.assignees);
    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    // Format Date: "25 Dec"
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <div
            onClick={() => onClick(task)}
            className="relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-3 active:scale-[0.98] transition-transform duration-200"
        >
            {/* Status Strip */}
            <div
                className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-md"
                style={{ backgroundColor: statusColor }}
            />

            <div className="pl-3">
                {/* Header: Title & Priority */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 mr-2">
                        {task.title}
                    </h3>
                    {priorityData && (
                        <div
                            className="flex items-center justify-center w-6 h-6 rounded-md shadow-sm flex-shrink-0"
                            style={{ backgroundColor: priorityData.color }}
                        >
                            <span className="text-xs" style={{ color: priorityData.textColor }}>{priorityData.icon}</span>
                        </div>
                    )}
                </div>

                {/* Info Row: Date & Labels */}
                <div className="flex items-center gap-3 mb-3 text-xs text-gray-500 dark:text-gray-400">
                    {task.dueDate && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                            <Calendar size={12} />
                            <span>{formatDate(task.dueDate)}</span>
                        </div>
                    )}
                    {/* If there are labels, show the first one as a pill */}
                    {task.labels && task.labels.length > 0 && (
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        // Ideally we would map label IDs to colors here, but for now a simple dot indicates labels exist
                    )}
                </div>

                {/* Footer: Assignees & Metadata */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">

                    {/* Assignees */}
                    <div className="flex -space-x-2">
                        {assignees.slice(0, 3).map((user, i) => (
                            <Avatar key={user._id || i} className="w-6 h-6 border-2 border-white dark:border-gray-800">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="text-[9px] bg-gray-100 text-gray-600">
                                    {user.fullName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {assignees.length === 0 && (
                            <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center">
                                <span className="text-[10px] text-gray-400">?</span>
                            </div>
                        )}
                    </div>

                    {/* Counts */}
                    <div className="flex items-center gap-3">
                        {/* Subtasks */}
                        {totalSubtasks > 0 && (
                            <div className="flex items-center gap-1 text-gray-500">
                                <GitMerge size={14} className="rotate-90" />
                                <span className="text-xs font-medium">{completedSubtasks}/{totalSubtasks}</span>
                            </div>
                        )}

                        {/* Comments */}
                        {task.comments?.length > 0 && (
                            <div className="flex items-center gap-1 text-gray-500">
                                <MessageSquare size={14} />
                                <span className="text-xs font-medium">{task.comments.length}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileTaskCard;
