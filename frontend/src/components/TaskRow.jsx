import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Maximize2, GitMerge, MessageSquare, TrendingUp, Plus, Lock, MoreHorizontal, Trash2 } from 'lucide-react';
import InlineTextEdit from './InlineTextEdit';
import InlineDropdown from './InlineDropdown';
import InlineAssigneePicker from './InlineAssigneePicker';
import InlineDatePicker from './InlineDatePicker';
import InlineLabelPicker from './InlineLabelPicker';

const TaskRow = ({
    task,
    index,
    users,
    boardId,
    statuses,
    priorities,
    isExpanded,
    toggleRow,
    openTaskModal,
    updateTask,
    updateTaskStatus,
    tShirtSizes,
    gridTemplate, // Passed from MainTable
    activeMenuTaskId, // For exclusive menu handling
    onToggleMenu,     // Toggle menu handler
    onDelete,          // Delete handler
    currentUser,       // Current logged in user
    updateSubtask      // New subtask updater
}) => {
    // const isExpanded = expandedRows.has(task._id); // Removed, passed as prop
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const menuRef = useRef(null);
    const menuButtonRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    const isMenuOpen = activeMenuTaskId === task._id;

    // Helper to normalize IDs (Backend sends objects {userId:1}, UI needs [1])
    const getIds = (list, key = 'userId') => {
        if (!list) return [];
        return list.map(item => {
            if (typeof item === 'object' && item !== null) {
                return item[key] || item[key.charAt(0).toUpperCase() + key.slice(1)] || item.id || item.Id || item._id || item.labelId || item.LabelId;
            }
            return item;
        });
    };

    // Helper to get subtask assignee ID, handling different field names
    const getSubtaskAssigneeId = (subtask) => {
        const id = subtask.assignee || subtask.assigneeId || subtask.AssigneeId;
        if (!id) return [];
        // Handle both object and primitive types
        if (typeof id === 'object' && id !== null) {
            return [id.id || id._id || id.userId || id.UserId];
        }
        return [id];
    };

    // Helpers embedded here (or can be props if needed, but safe here if pure)
    const getStatusColor = (statusId) => statuses.find(s => s.id === statusId)?.color || '#c4c4c4';
    // Manual progress only
    const calculateProgress = (task) => {
        return task.progress || 0;
    };
    const getPriorityData = (priorityId) => priorities.find(p => p.id === priorityId) || priorities[0];

    const progress = task.progress || 0;

    const handleSubtaskUpdate = (subtask, overrides) => {
        if (!updateSubtask) return;

        const payload = {
            title: subtask.title || subtask.Title,
            isCompleted: subtask.isCompleted ?? subtask.IsCompleted,
            assigneeId: subtask.assigneeId || subtask.AssigneeId || (typeof subtask.assignee === 'object' ? (subtask.assignee?.id || subtask.assignee?._id) : subtask.assignee),
            startDate: subtask.startDate || subtask.StartDate,
            dueDate: subtask.dueDate || subtask.DueDate,
            ...overrides
        };

        updateSubtask(subtask.id || subtask._id || subtask.Id, payload);
    };

    const toggleSubtask = (task, index) => {
        const subtask = task.subtasks[index];
        handleSubtaskUpdate(subtask, { isCompleted: !subtask.isCompleted });
    };

    const updateSubtaskAssignee = (task, index, newAssignees) => {
        const subtask = task.subtasks[index];
        const newAssigneeId = newAssignees.length > 0 ? newAssignees[newAssignees.length - 1] : null;
        handleSubtaskUpdate(subtask, { assigneeId: newAssigneeId });
    };

    // Calculate menu position
    useEffect(() => {
        if (isMenuOpen && menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX
            });
        }
    }, [isMenuOpen]);

    // Handle outside clicks for menu
    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                menuButtonRef.current && !menuButtonRef.current.contains(event.target)) {
                onToggleMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen, onToggleMenu]);

    return (
        <React.Fragment>
            {/* Main Task Row - Soft UI: 56px min-height, softer borders */}
            <div
                className="grid items-stretch min-h-[56px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 group cursor-pointer w-full"
                onClick={() => openTaskModal(task)}
                style={{ gridTemplateColumns: gridTemplate }}
            >
                {/* 1. Expander */}
                <div className="flex items-center justify-center py-1 border-r border-gray-200 dark:border-gray-700 ml-0">
                    {hasSubtasks && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleRow(task._id);
                            }}
                            className={`p-0.5 rounded hover:bg-gray-200 text-gray-400 transition-all ${isExpanded ? 'rotate-90 text-gray-600' : ''}`}
                        >
                            <ChevronDown size={14} fill="currentColor" className="transform -rotate-90 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                        </button>
                    )}
                </div>

                {/* 2. Task Title */}
                <div className="px-4 py-0 border-r border-gray-200 dark:border-gray-700 group/title flex justify-between gap-2 relative h-full">
                    <div className="flex-1 min-w-0 flex items-center gap-2 h-full">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getStatusColor(task.status) }}></div>
                        {task.isPrivate && (
                            <div title="Özel Görev (Sadece siz ve atananlar görebilir)" className="shrink-0">
                                <Lock size={12} className="text-gray-400 shrink-0" />
                            </div>
                        )}
                        <InlineTextEdit
                            value={task.title}
                            onSave={(newTitle) => updateTask(task._id, { title: newTitle })}
                            className="font-medium text-gray-900 dark:text-gray-100 flex-1 text-sm"
                        />
                    </div>

                    {/* Hover Actions */}
                    <div className="flex items-center gap-1 absolute right-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-[2px] rounded-md px-1 py-0.5 z-10 top-1/2 -translate-y-1/2">
                        {/* More Menu functionality moved to end column */}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openTaskModal(task);
                            }}
                            className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition-colors opacity-0 group-hover/title:opacity-100"
                            title="Tam Görünüm Aç"
                        >
                            <Maximize2 size={12} />
                        </button>




                        {task.subtasks?.length > 0 && (
                            <div
                                className="flex items-center gap-1.5 px-1.5 py-0.5 bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 rounded-md border border-gray-100 dark:border-gray-700/50 shadow-sm hover:border-[#6366f1] transition-colors cursor-pointer"
                                title="Alt Görevler"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openTaskModal(task, 'subtasks');
                                }}
                            >
                                <GitMerge size={10} className="rotate-90 text-[#6366f1]" />
                                <span className="text-[10px] font-bold tracking-tight">
                                    {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length}
                                </span>
                            </div>
                        )}


                        {task.attachments?.length > 0 && (
                            <div
                                className="flex items-center gap-1.5 px-1.5 py-0.5 bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 rounded-md border border-gray-100 dark:border-gray-700/50 shadow-sm hover:border-[#6366f1] transition-colors cursor-pointer"
                                title={`${task.attachments.length} dosya`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openTaskModal(task, 'files');
                                }}
                            >
                                <TrendingUp size={10} className="rotate-90 text-[#6366f1]" />
                                <span className="text-[10px] font-bold tracking-tight">
                                    {task.attachments.length}
                                </span>
                            </div>
                        )}

                        {task.comments?.length > 0 && (
                            <div
                                className="flex items-center gap-1.5 px-1.5 py-0.5 bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 rounded-md border border-gray-100 dark:border-slate-700/50 shadow-sm hover:border-[#00c875] transition-colors cursor-pointer"
                                title={`${task.comments.length} yorum`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openTaskModal(task, 'comments');
                                }}
                            >
                                <MessageSquare size={10} className="text-[#00c875]" />
                                <span className="text-[10px] font-bold tracking-tight">
                                    {task.comments.length}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Status */}
                <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 flex items-center h-full">
                    <InlineDropdown
                        value={task.status}
                        options={statuses}
                        onChange={(newStatus) => updateTaskStatus(task._id, newStatus)}
                    />
                </div>

                {/* 4. Priority */}
                <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 flex items-center h-full">
                    <InlineDropdown
                        value={task.priority}
                        options={priorities}
                        onChange={(newPriority) => updateTask(task._id, { priority: newPriority })}
                        softBadge={true}
                    />
                </div>

                {/* 5. T-Shirt Size */}
                <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 flex items-center h-full">
                    <InlineDropdown
                        value={task.tShirtSize || null}
                        options={tShirtSizes}
                        onChange={(newSize) => updateTask(task._id, { tShirtSize: newSize })}
                        softBadge={true}
                    />
                </div>

                <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 flex items-center h-full">
                    <InlineAssigneePicker
                        assigneeIds={getIds(task.assignees, 'userId')}
                        allUsers={users}
                        onChange={(newAssignees) => updateTask(task._id, { assignees: newAssignees })}
                    />
                </div>

                {/* 7. Due Date */}
                <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 flex items-center h-full">
                    <InlineDatePicker
                        value={task.dueDate}
                        onChange={(newDate) => updateTask(task._id, { dueDate: newDate })}
                    />
                </div>

                <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 flex items-center h-full">
                    <InlineLabelPicker
                        taskId={task._id}
                        currentLabels={getIds(task.labels, 'labelId')}
                        projectId={boardId}
                        onUpdate={(taskId, newLabels) => updateTask(taskId, { labels: newLabels })}
                    />
                </div>

                {/* 9. Progress */}
                <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 flex items-center h-full">
                    <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out bg-blue-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex items-center">
                            <InlineTextEdit
                                value={progress.toString()}
                                onSave={(val) => {
                                    let newProg = parseInt(val, 10);
                                    if (isNaN(newProg)) newProg = 0;
                                    if (newProg > 100) newProg = 100;
                                    if (newProg < 0) newProg = 0;
                                    updateTask(task._id, { progress: newProg });
                                }}
                                className={`text-[10px] font-bold text-right w-6 ${progress === 100 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                            />
                            <span className="text-[10px] text-slate-400 -ml-1">%</span>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-1 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openTaskModal(task, 'files');
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                        {task.attachments?.length > 0 ? (
                            <div className="flex items-center gap-1">
                                <TrendingUp size={14} className="rotate-90" />
                                <span className="text-[10px] font-bold">{task.attachments.length}</span>
                            </div>
                        ) : (
                            <Plus size={14} />
                        )}
                    </button>
                </div>

                <div className="px-4 py-1 border-r border-gray-200 dark:border-gray-700 flex items-center justify-start overflow-hidden">
                    {task.createdBy ? (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Oluşturan:</span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                {users.find(u => u.id === task.createdBy || u._id === task.createdBy)?.fullName || 'Bilinmeyen'}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400">-</span>
                    )}
                </div>

                {/* 11. Actions (Delete) */}
                <div className="px-1 py-1 flex items-center justify-center">
                    {(currentUser?.role === 'admin' || task.createdBy === currentUser?.id || (!task.createdBy && task.assignedBy === currentUser?.id)) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task._id);
                            }}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Görevi Sil"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

            </div>


            {/* Subtasks Accordion Row */}
            {isExpanded && hasSubtasks && (
                <div className="bg-slate-50/50 dark:bg-slate-800/50 shadow-inner w-full">
                    {task.subtasks.map((subtask, sIndex) => (
                        <div
                            key={sIndex}
                            className="grid border-b border-slate-200/50 dark:border-slate-700/50 h-10 items-center hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors w-full"
                            style={{ gridTemplateColumns: gridTemplate }}
                        >
                            {/* 1. Indent/Expander - Empty or different for subtask */}
                            <div className="border-r border-gray-100/50 dark:border-gray-700/50 h-full"></div>

                            {/* 2. Title + Checkbox */}
                            <div className="px-3 flex items-center gap-2 border-r border-gray-100/50 dark:border-gray-700/50 h-full pl-8"> {/* Indented */}
                                <input
                                    type="checkbox"
                                    checked={subtask.isCompleted}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleSubtask(task, sIndex);
                                    }}
                                    className="rounded-full w-3 h-3 border-gray-400 text-green-500 focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`text-xs ${subtask.isCompleted ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {subtask.title}
                                </span>
                            </div>

                            {/* 3. Status - Empty for subtask or specific logic */}
                            <div className="border-r border-gray-100/50 dark:border-gray-700/50 h-full"></div>

                            {/* 4. Priority - Empty */}
                            <div className="border-r border-gray-100/50 dark:border-gray-700/50 h-full"></div>

                            {/* 5. T-Shirt = Empty */}
                            <div className="border-r border-gray-100/50 dark:border-gray-700/50 h-full"></div>

                            {/* 6. Assignee - for subtask */}
                            <div className={`border-r border-gray-100/50 dark:border-gray-700/50 h-full pl-3 flex items-center ${subtask.isCompleted ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                <InlineAssigneePicker
                                    assigneeIds={getSubtaskAssigneeId(subtask)}
                                    allUsers={users}
                                    onChange={(newIds) => updateSubtaskAssignee(task, sIndex, newIds)}
                                />
                            </div>

                            {/* 7. Due Date */}
                            <div className={`border-r border-gray-100/50 dark:border-gray-700/50 h-full flex items-center pl-2 ${subtask.isCompleted ? 'opacity-50 pointer-events-none' : ''}`}>
                                <InlineDatePicker
                                    value={subtask.dueDate}
                                    onChange={(newDate) => handleSubtaskUpdate(subtask, { dueDate: newDate })}
                                />
                            </div>

                            {/* 8. Labels - Empty */}
                            <div className="border-r border-gray-100/50 dark:border-gray-700/50 h-full"></div>

                            {/* 9. Progress - Empty */}
                            <div className="border-r border-gray-100/50 dark:border-gray-700/50 h-full"></div>

                            {/* 10. Files - Empty */}
                            <div className="h-full border-r border-gray-100/50 dark:border-gray-700/50"></div>

                            {/* 11. Created By - Empty */}
                            <div className="h-full border-r border-gray-100/50 dark:border-gray-700/50"></div>

                            {/* 12. Actions - Empty */}
                            <div className="h-full"></div>
                        </div>
                    ))}
                </div>
            )}
        </React.Fragment>
    );
};

export default TaskRow;
