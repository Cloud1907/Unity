import React, { useMemo } from 'react';
import { Calendar, GitMerge, MessageSquare, Paperclip, Link as LinkIcon } from 'lucide-react';
import UserAvatar from './ui/shared/UserAvatar';
import { Badge } from './ui/badge';
import { statuses } from '../constants/taskConstants';
import { useDataState } from '../contexts/DataContext';

const MobileTaskCard = ({ task, onClick, getStatusColor, getPriorityData }) => {
    const { users } = useDataState(); 
    
    const statusObj = statuses.find(s => s.id === task.status) || statuses[0];
    const statusColor = getStatusColor(task.status);
    const priorityData = getPriorityData(task.priority);

    // Robust Assignee Resolution - Direct Context Access
    const assignees = useMemo(() => {
        if (!task.assignees || task.assignees.length === 0) return [];

        return task.assignees.map(item => {
            // Case 1: Item is an Object (Already populated or partial)
            if (typeof item === 'object' && item !== null) {
                // If it has full profile, use it
                if (item.fullName) return item;
                
                // If it has an ID, try to look it up in context to get latest data
                if (item.id || item.userId) {
                    const id = Number(item.id || item.userId);
                    const found = users.find(u => u.id === id);
                    if (found) return found;
                    return { ...item, fullName: '?', color: '#cbd5e1' }; 
                }
                return { fullName: '?', color: '#cbd5e1' };
            }

            // Case 2: Item is an ID (Number or String)
            const userId = Number(item);
            const user = users.find(u => u.id === userId);
            if (user) return user;
            
            return { id: item, fullName: '?', color: '#cbd5e1' }; 
        });
    }, [task.assignees, users]);

    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const commentCount = task.comments?.length || 0;
    const attachmentCount = task.attachments?.length || 0;
    const hasLink = !!task.taskUrl;

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
            className="group relative bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.99] transition-all duration-200"
        >
            {/* Header: Title & Priority */}
            <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 leading-tight line-clamp-2">
                    {task.title}
                </h3>
                {priorityData && (
                    <div className="shrink-0">
                         {/* Priority Data (Icon Only) */}
                         <div 
                            className="w-5 h-5 flex items-center justify-center rounded-full"
                            style={{ backgroundColor: priorityData.bgColor || priorityData.color }}
                         >
                            <span style={{ color: priorityData.textColor, fontSize: '10px' }}>{priorityData.icon}</span>
                         </div>
                    </div>
                )}
            </div>

            {/* Info Row: Status & Date */}
            <div className="flex items-center gap-2 mb-3">
                {/* Status Badge (Pill) */}
                <Badge 
                    className="border-0 font-medium px-2 py-0.5 rounded-md text-[10px] shadow-none uppercase tracking-wide"
                    style={{ 
                        backgroundColor: statusColor + '15', 
                        color: statusColor,
                    }}
                >
                    {statusObj.label}
                </Badge>

                {/* Date */}
                {task.dueDate && (
                    <div className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        <Calendar size={12} />
                        <span>{formatDate(task.dueDate)}</span>
                    </div>
                )}
            </div>

            {/* Footer: Assignees & Metadata */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
                {/* Assignees */}
                <div className="flex -space-x-1.5 pl-0.5">
                    {assignees && assignees.length > 0 ? (
                        assignees.slice(0, 4).map((user, i) => (
                            <UserAvatar
                                key={user.id || i}
                                user={user}
                                size="xs"
                                className="border-[1.5px] border-white dark:border-gray-800 w-6 h-6 ring-1 ring-gray-100 dark:ring-gray-800"
                            />
                        ))
                    ) : (
                        <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                            <span className="text-[9px] text-gray-400">?</span>
                        </div>
                    )}
                    {assignees && assignees.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800 border-[1.5px] border-white dark:border-gray-800 flex items-center justify-center text-[9px] text-gray-500 font-medium">
                            +{assignees.length - 4}
                        </div>
                    )}
                </div>

                {/* Counts - Compact & Visible */}
                <div className="flex items-center gap-2.5">
                    {/* Subtasks */}
                    {totalSubtasks > 0 && (
                        <div className={`flex items-center gap-1 text-[10px] font-medium ${completedSubtasks === totalSubtasks ? 'text-green-600 dark:text-green-500' : 'text-slate-400 dark:text-slate-500'}`}>
                            <GitMerge size={12} />
                            <span>{completedSubtasks}/{totalSubtasks}</span>
                        </div>
                    )}
                    
                    {/* Comments */}
                    {commentCount > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            <MessageSquare size={12} />
                            <span>{commentCount}</span>
                        </div>
                    )}

                    {/* Attachments */}
                    {attachmentCount > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            <Paperclip size={12} />
                            <span>{attachmentCount}</span>
                        </div>
                    )}

                    {/* Link */}
                    {hasLink && (
                         <div className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400">
                            <LinkIcon size={10} />
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(MobileTaskCard);
