import React from 'react';
import { Calendar, GitMerge, MessageSquare, Clock } from 'lucide-react';
import UserAvatar from './ui/shared/UserAvatar';
import { Badge } from './ui/badge';

const MobileTaskCard = ({ task, onClick, getStatusColor, getPriorityData, getAssignees }) => {
    const statusColor = getStatusColor(task.status);
    const priorityData = getPriorityData(task.priority);
    // Resolve assignees from IDs to Objects if helper matches
    const assignees = getAssignees ? getAssignees(task.assignees) : (task.assignees || []);

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
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: priorityData.bgColor + '20', color: priorityData.textColor }}>
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
                        <div className="flex items-center gap-1">
                            {task.labels.slice(0, 1).map((label, idx) => (
                                <Badge key={idx} variant="outline" className="h-5 px-1.5 text-[10px] font-normal border-slate-200 text-slate-500">
                                    {label.name || label}
                                </Badge>
                            ))}
                            {task.labels.length > 1 && (
                                <span className="text-[10px] text-slate-400">+{task.labels.length - 1}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer: Assignees & Metadata */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">

                    {/* Assignees */}
                    <div className="flex -space-x-2">
                        {assignees && assignees.length > 0 ? (
                            assignees.slice(0, 3).map((user, i) => (
                                <UserAvatar
                                    key={user.id || i}
                                    user={user}
                                    size="sm"
                                    className="border-2 border-white dark:border-gray-800"
                                />
                            ))
                        ) : (
                            <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center">
                                <span className="text-[10px] text-gray-400">?</span>
                            </div>
                        )}
                    </div>

                    {/* Counts */}
                    <div className="flex items-center gap-3">
                        {totalSubtasks > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <GitMerge size={12} />
                                <span>{completedSubtasks}/{totalSubtasks}</span>
                            </div>
                        )}
                        {task.comments && task.comments.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <MessageSquare size={12} />
                                <span>{task.comments.length}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileTaskCard;
