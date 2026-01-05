import React from 'react';
import { ChevronDown, Maximize2, GitMerge, MessageSquare, TrendingUp, Plus } from 'lucide-react';
import InlineTextEdit from './InlineTextEdit';
import InlineDropdown from './InlineDropdown';
import InlineAssigneePicker from './InlineAssigneePicker';
import InlineDatePicker from './InlineDatePicker';
import InlineLabelPicker from './InlineLabelPicker';

const TaskRow = React.memo(({
    task,
    index,
    users,
    boardId,
    statuses,
    priorities,
    expandedRows,
    toggleRow,
    openTaskModal,
    updateTask,
    updateTaskStatus
}) => {
    const isExpanded = expandedRows.has(task._id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    // Helpers embedded here (or can be props if needed, but safe here if pure)
    const getStatusColor = (statusId) => statuses.find(s => s.id === statusId)?.color || '#c4c4c4';
    // Manual progress only
    const calculateProgress = (task) => {
        return task.progress || 0;
    };
    const getPriorityData = (priorityId) => priorities.find(p => p.id === priorityId) || priorities[0];

    const progress = task.progress || 0;

    const toggleSubtask = (task, index) => {
        // IMMUTABLE UPDATE: Create a new array and new object for the changed item
        const newSubtasks = task.subtasks.map((st, i) =>
            i === index ? { ...st, completed: !st.completed } : st
        );
        updateTask(task._id, { subtasks: newSubtasks });
    };

    const updateSubtaskAssignee = (task, index, newAssignees) => {
        const newAssigneeId = newAssignees.length > 0 ? newAssignees[newAssignees.length - 1] : null;
        // IMMUTABLE UPDATE
        const newSubtasks = task.subtasks.map((st, i) =>
            i === index ? { ...st, assignee: newAssigneeId } : st
        );
        updateTask(task._id, { subtasks: newSubtasks });
    };

    return (
        <React.Fragment>
            {/* Main Task Row */}
            <div
                className="flex hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border-b border-gray-100 dark:border-gray-800 group cursor-pointer"
                onClick={() => openTaskModal(task)}
            >
                <div className="w-10 flex items-center justify-center py-3 border-r border-gray-100 dark:border-gray-800">
                    <input
                        type="checkbox"
                        className="rounded w-3.5 h-3.5 cursor-pointer transition-transform hover:scale-110"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                <div className="w-8 flex items-center justify-center py-3 border-r border-gray-100 dark:border-gray-800">
                    {hasSubtasks && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(task._id);
                            }}
                            className={`p-0.5 rounded hover:bg-gray-200 text-gray-400 transition-all ${isExpanded ? 'rotate-90 text-gray-600' : ''}`}
                        >
                            <ChevronDown size={14} fill="currentColor" className="transform -rotate-90 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                        </button>
                    )}
                </div>
                <div className="w-72 px-3 py-3 border-r border-gray-100 dark:border-gray-800 group/title flex items-center justify-between gap-2 relative">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getStatusColor(task.status) }}></div>
                        <InlineTextEdit
                            value={task.title}
                            onSave={(newTitle) => updateTask(task._id, { title: newTitle })}
                            className="font-medium text-gray-900"
                        />
                    </div>

                    {/* Hover Actions */}
                    <div className="flex items-center gap-1 absolute right-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-[2px] rounded-md px-1 py-0.5 z-10">
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
                                    {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                </span>
                            </div>
                        )}

                        {task.comments?.length > 0 && (
                            <div
                                className="flex items-center gap-1.5 px-1.5 py-0.5 bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 rounded-md border border-gray-100 dark:border-gray-700/50 shadow-sm hover:border-[#00c875] transition-colors cursor-pointer"
                                title="Yorumlar"
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
                <div className="w-40 px-3 py-3 border-r border-gray-100 dark:border-gray-800">
                    <InlineDropdown
                        value={task.status}
                        options={statuses}
                        onChange={(newStatus) => updateTaskStatus(task._id, newStatus)}
                    />
                </div>
                <div className="w-32 px-3 py-3 border-r border-gray-100 dark:border-gray-800">
                    <InlineDropdown
                        value={task.priority}
                        options={priorities}
                        onChange={(newPriority) => updateTask(task._id, { priority: newPriority })}
                    />
                </div>
                <div className="w-40 px-3 py-3 border-r border-gray-100 dark:border-gray-800">
                    <InlineAssigneePicker
                        assigneeIds={task.assignees}
                        allUsers={users}
                        onChange={(newAssignees) => updateTask(task._id, { assignees: newAssignees })}
                    />
                </div>
                <div className="w-28 px-3 py-3 border-r border-gray-100 dark:border-gray-800">
                    <InlineDatePicker
                        value={task.dueDate}
                        onChange={(newDate) => updateTask(task._id, { dueDate: newDate })}
                    />
                </div>
                <div className="w-40 px-3 py-3 border-r border-gray-100 dark:border-gray-800">
                    <InlineLabelPicker
                        taskId={task._id}
                        currentLabels={task.labels || []}
                        projectId={boardId}
                        onUpdate={(taskId, newLabels) => updateTask(taskId, { labels: newLabels })}
                    />
                </div>
                <div className="w-28 px-3 py-3 border-r border-gray-100 dark:border-gray-800 flex items-center">
                    <div className="flex flex-col gap-1.5 w-full">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden shadow-inner">
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-end">
                            <InlineTextEdit
                                value={progress.toString()}
                                onSave={(val) => {
                                    let newProg = parseInt(val, 10);
                                    if (isNaN(newProg)) newProg = 0;
                                    if (newProg > 100) newProg = 100;
                                    if (newProg < 0) newProg = 0;
                                    updateTask(task._id, { progress: newProg });
                                }}
                                className={`text-[10px] font-bold text-right w-8 ${progress === 100 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                            />
                            <span className="text-[10px] text-slate-400 ml-0.5">%</span>
                        </div>
                    </div>
                </div>
                <div className="w-20 px-3 py-3 flex items-center justify-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openTaskModal(task, 'files');
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50"
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
            </div>

            {/* Subtasks Accordion Row */}
            {isExpanded && hasSubtasks && (
                <div className="bg-gray-50/50 shadow-inner">
                    {task.subtasks.map((subtask, sIndex) => (
                        <div key={sIndex} className="flex border-b border-gray-100/50 pl-12 h-10 items-center hover:bg-gray-100 transition-colors">
                            <div className="w-8 border-r border-gray-100/50 h-full"></div> {/* Indent line */}
                            <div className="w-72 px-3 flex items-center gap-2 border-r border-gray-100/50 h-full">
                                <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleSubtask(task, sIndex);
                                    }}
                                    className="rounded-full w-3 h-3 border-gray-400 text-green-500 focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`text-xs ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                    {subtask.title}
                                </span>
                            </div>
                            <div className="w-40 border-r border-gray-100/50 h-full"></div>
                            <div className="w-32 border-r border-gray-100/50 h-full"></div>
                            <div className="w-40 border-r border-gray-100/50 h-full pl-3 flex items-center">
                                <InlineAssigneePicker
                                    assigneeIds={subtask.assignee ? [subtask.assignee] : []}
                                    allUsers={users}
                                    onChange={(newIds) => updateSubtaskAssignee(task, sIndex, newIds)}
                                />
                            </div>
                            <div className="w-28 border-r border-gray-100/50 h-full"></div>
                            <div className="w-40 border-r border-gray-100/50 h-full"></div>
                            <div className="w-28 border-r border-gray-100/50 h-full"></div>
                            <div className="w-20 h-full"></div>
                        </div>
                    ))}
                </div>
            )}
        </React.Fragment>
    );
});

export default TaskRow;
