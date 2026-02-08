import React, { useCallback } from 'react';
import { ChevronRight, Maximize2, Layers, MessageSquare, Paperclip, Plus, Trash2, CornerDownRight } from 'lucide-react';

import { EXPANDER_COLUMN_WIDTH, TASK_COLUMN_WIDTH } from '../constants/taskConstants';
import { extractIds } from '../utils/entityUtils';
import InlineTextEdit from './InlineTextEdit';
import InlineDropdown from './InlineDropdown';
import InlineAssigneePicker from './InlineAssigneePicker';
import InlineEditableCell from './InlineEditableCell';
import InlineProgressBar from './InlineProgressBar';
import InlineDatePicker from './InlineDatePicker';
import InlineLabelPicker from './InlineLabelPicker';
import { useTaskDetails } from '../hooks/useTaskDetails';

function TaskRow({
    task,
    index,
    users,
    boardId,
    workspaceId,
    statuses,
    priorities,
    isExpanded,
    toggleRow,
    openTaskModal,
    updateTask,
    updateTaskStatus,
    tShirtSizes,
    gridTemplate, // Expects "32px 380px ..." format
    activeMenuTaskId,
    onToggleMenu,
    onDelete,
    currentUser,
    updateSubtask,
    depth = 0,
    visibleColumns
}) {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    // --- HANDLERS (Memoized) ---

    const handleUpdateTask = useCallback((id, data) => {
        updateTask(id, data);
    }, [updateTask]);

    const handleUpdateStatus = useCallback((id, status) => {
        updateTaskStatus(id, status);
    }, [updateTaskStatus]);

    const handleToggleRow = useCallback((id) => {
        toggleRow(id);
    }, [toggleRow]);

    const handleOpenModal = useCallback(() => {
        if (depth === 0) openTaskModal(task);
    }, [depth, task, openTaskModal]);

    const handleAssigneeChange = useCallback((newIds) => {
        // Optimistic Data: Construct full objects for avatars to prevent "..."
        const optimisticAssignees = newIds.map(id => {
            const user = users.find(u => Number(u.id) === Number(id));
            if (user) return user;
            return { id, userId: id, fullName: '...', avatar: null }; // Fallback
        });

        if (depth > 0) {
            updateSubtask(task.id, { assignees: newIds }, { assignees: optimisticAssignees });
        } else {
            handleUpdateTask(task.id, { assignees: newIds }, { assignees: optimisticAssignees });
        }
    }, [depth, task.id, handleUpdateTask, updateSubtask, users]);

    const handleLabelUpdate = useCallback((tid, newLabels) => {
        handleUpdateTask(tid, { labels: newLabels });
    }, [handleUpdateTask]);

    const getStatusColor = useCallback((statusId) =>
        statuses.find(s => s.id === statusId)?.color || '#c4c4c4',
        [statuses]);

    const progress = task.progress || 0;

    return (
        <React.Fragment>
            <div
                className={`grid items-center border-b border-slate-200 dark:border-slate-700 transition-colors duration-200 group w-full ${depth > 0 ? 'bg-slate-50/50 hover:bg-slate-100' : 'hover:bg-slate-50'}`}
                onClick={handleOpenModal} // Prevent opening modal for subtasks
                style={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplate,
                    height: depth > 0 ? '42px' : '52px',
                    minHeight: depth > 0 ? '42px' : '52px',
                    maxHeight: depth > 0 ? '42px' : '52px',
                    boxSizing: 'border-box',
                }}
            >
                {/* 1. Expander - Sticky Left (Fixed 32px width) */}
                <div
                    className="sticky left-0 z-30 flex items-center justify-center h-full border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors"
                    style={{
                        width: EXPANDER_COLUMN_WIDTH,
                        minWidth: EXPANDER_COLUMN_WIDTH,
                        maxWidth: EXPANDER_COLUMN_WIDTH,
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Millimetric Alignment Placeholder */}
                    <div className="absolute left-0 top-0 bottom-0 w-1"></div>

                    {hasSubtasks && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleRow(task.id);
                            }}
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 transition-all duration-200 ${isExpanded ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : ''}`}
                        >
                            <ChevronRight
                                size={14}
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            />
                        </button>
                    )}
                </div>

                {/* 2. Task Title - Sticky Left (Fixed 380px width) */}
                <div
                    className="sticky z-20 h-full border-r border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 bg-white dark:bg-[#0f172a] group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors"
                    style={{
                        left: EXPANDER_COLUMN_WIDTH,
                        width: TASK_COLUMN_WIDTH,
                        minWidth: TASK_COLUMN_WIDTH,
                        maxWidth: TASK_COLUMN_WIDTH,
                        boxSizing: 'border-box'
                    }}
                >
                    <div
                        className="flex-1 min-w-0 flex items-center gap-2 h-full overflow-hidden"
                        style={{ paddingLeft: depth > 0 ? (depth * 28) + 'px' : '0' }}
                    >
                        {depth > 0 && (
                            <CornerDownRight size={14} className="text-slate-400 shrink-0" />
                        )}
                        {depth > 0 ? (
                            <input
                                type="checkbox"
                                checked={task.isCompleted || false}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    // STOP PROPAGATION HERE TOO JUST IN CASE
                                    e.stopPropagation();
                                    updateSubtask(task.id, { isCompleted: e.target.checked });
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                            />
                        ) : (
                            <div className="w-2 h-2 rounded-full shrink-0 align-middle" style={{ backgroundColor: getStatusColor(task.status) }}></div>
                        )}
                        <InlineTextEdit
                            value={task.title}
                            onSave={(newTitle) => handleUpdateTask(task.id, { title: newTitle })}
                            onClick={(e) => e.stopPropagation()}
                            multiLine={true}
                            className={`font-normal text-gray-800 dark:text-gray-200 flex-1 text-[13px] tracking-tight ${task.isCompleted ? 'line-through text-gray-400' : ''}`}
                        />
                    </div>

                    {/* Icons Container - Flexible but constrained */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        {(task.subtasksCount > 0 || (task.subtasks && task.subtasks.length > 0)) && (
                            <div className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); openTaskModal(task, 'subtasks'); }}>
                                <Layers size={12} className="shrink-0" />
                                <span className="text-[11px] font-medium">
                                    {task.subtasks?.length > 0
                                        ? `${task.subtasks.filter(s => s.isCompleted).length}/${task.subtasks.length}`
                                        : `${Math.round(((task.progress || 0) / 100) * (task.subtasksCount || 0))}/${task.subtasksCount || 0}`
                                    }
                                </span>
                            </div>
                        )}
                        {(task.commentsCount > 0 || (task.comments && task.comments.length > 0)) && (
                            <div className="flex items-center gap-1 text-amber-500 hover:text-amber-600 cursor-pointer" onClick={(e) => { e.stopPropagation(); openTaskModal(task, 'comments'); }}>
                                <MessageSquare size={12} className="shrink-0" />
                                <span className="text-[11px] font-medium">{task.commentsCount || task.comments?.length}</span>
                            </div>
                        )}
                        {(task.attachmentsCount > 0 || (task.attachments && task.attachments.length > 0)) && (
                            <div className="flex items-center gap-1 text-rose-400 hover:text-rose-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); openTaskModal(task, 'files'); }}>
                                <Paperclip size={12} className="shrink-0" />
                                <span className="text-[11px] font-medium">{task.attachmentsCount || task.attachments?.length}</span>
                            </div>
                        )}

                        {depth === 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); openTaskModal(task); }}
                                className="p-1 text-slate-400 hover:text-indigo-600 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Maximize2 size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Status */}
                {visibleColumns.status && (
                    <div className="h-full flex items-center px-3 border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}>
                        {depth === 0 && (
                            <InlineDropdown
                                value={task.status}
                                options={statuses}
                                onChange={(newStatus) => handleUpdateStatus(task.id, newStatus)}
                            />
                        )}
                    </div>
                )}

                {/* 4. Priority */}
                {visibleColumns.priority && (
                    <div className="h-full flex items-center px-3 border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}>
                        {depth === 0 && (
                            <InlineDropdown
                                value={task.priority}
                                options={priorities}
                                onChange={(newPriority) => handleUpdateTask(task.id, { priority: newPriority })}
                                softBadge={true}
                            />
                        )}
                    </div>
                )}

                {/* 5. Assignee */}
                {visibleColumns.assignee && (
                    <div className="h-full flex items-center px-3 border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}>
                        <InlineAssigneePicker
                            assigneeIds={extractIds(task.assignees, 'userId')}
                            assignees={task.assignees}
                            allUsers={users}
                            workspaceId={workspaceId}
                            onChange={handleAssigneeChange}
                        />
                    </div>
                )}

                {/* 5.5 Start Date */}
                {visibleColumns.startDate && (
                    <div className="h-full flex items-center px-3 border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}>
                        <InlineDatePicker
                            value={task.startDate}
                            placeholder="Başlangıç"
                            onChange={(newDate) => {
                                if (depth > 0) {
                                    updateSubtask(task.id, { startDate: newDate });
                                } else {
                                    handleUpdateTask(task.id, { startDate: newDate });
                                }
                            }}
                        />
                    </div>
                )}

                {/* 6. Due Date */}
                {visibleColumns.dueDate && (
                    <div className="h-full flex items-center px-3 border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}>
                        <InlineDatePicker
                            value={task.dueDate}
                            onChange={(newDate) => {
                                if (depth > 0) {
                                    updateSubtask(task.id, { dueDate: newDate });
                                } else {
                                    handleUpdateTask(task.id, { dueDate: newDate });
                                }
                            }}
                        />
                    </div>
                )}

                {/* 7. Labels */}
                {visibleColumns.labels && (
                    <div className="h-full flex items-center px-3 border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}>
                        {depth === 0 && (
                            <InlineLabelPicker
                                taskId={task.id}
                                currentLabels={task.labels}
                                projectId={boardId}
                                onUpdate={handleLabelUpdate}
                            />
                        )}
                    </div>
                )}

                {/* 8. T-Shirt Size */}
                {visibleColumns.tShirtSize && (
                    <div className="h-full flex items-center px-3 border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}>
                        {depth === 0 && (
                            <InlineDropdown
                                value={task.tShirtSize || null}
                                options={tShirtSizes}
                                onChange={(newSize) => updateTask(task.id, { tShirtSize: newSize })}
                                softBadge={true}
                            />
                        )}
                    </div>
                )}

                {/* 9. Progress */}
                {visibleColumns.progress && (
                    <div className="h-full flex items-center px-3 border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}>
                        {depth === 0 && (
                            <InlineProgressBar
                                progress={task.progress}
                                onUpdate={(val) => updateTask(task.id, { progress: val })}
                            />
                        )}
                    </div>
                )}

                {/* 10. Files */}
                {
                    visibleColumns.files && (
                        <div className="h-full flex items-center justify-center px-3 border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}>
                            {depth === 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openTaskModal(task, 'files');
                                    }}
                                    className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    {task.attachmentsCount > 0 || task.attachments?.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                            <Paperclip size={14} />
                                            <span className="text-[10px] font-bold">{task.attachmentsCount || task.attachments?.length}</span>
                                        </div>
                                    ) : (
                                        <Plus size={14} />
                                    )}
                                </button>
                            )}
                        </div>
                    )
                }

                {/* 11. Created By */}
                {
                    visibleColumns.createdBy && (
                        <div className="h-full flex items-center justify-start px-3 border-r border-slate-200 dark:border-slate-700 overflow-hidden" style={{ boxSizing: 'border-box' }}>
                            {depth === 0 && (
                                task.createdBy ? (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 truncate">
                                            {users.find(u => u.id === task.createdBy)?.fullName || 'Bilinmeyen'}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                )
                            )}
                        </div>
                    )
                }

                {/* 12. Actions (Delete) */}
                <div className="h-full flex items-center justify-center px-1 border-r border-slate-200 dark:border-slate-700 bg-clip-padding" style={{ boxSizing: 'border-box' }}>
                    {(currentUser?.role === 'admin' || task.createdBy === currentUser?.id || (!task.createdBy && task.assignedBy === currentUser?.id)) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task.id);
                            }}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Görevi Sil"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

            </div >

            {/* Subtasks - Recursive Rendering */}
            {
                isExpanded && hasSubtasks && (
                    <div className="w-full">
                        {task.subtasks.map((subtask, sIndex) => (
                            <div key={subtask.id} className="w-full">
                                <TaskRow
                                    task={subtask}
                                    index={sIndex}
                                    users={users}
                                    boardId={boardId}
                                    workspaceId={workspaceId}
                                    statuses={statuses}
                                    priorities={priorities}
                                    tShirtSizes={tShirtSizes}
                                    gridTemplate={gridTemplate}
                                    activeMenuTaskId={activeMenuTaskId}
                                    onToggleMenu={onToggleMenu}
                                    onDelete={onDelete}
                                    currentUser={currentUser}
                                    updateTask={updateSubtask}
                                    updateTaskStatus={(id, status) => updateSubtask(id, { status })}
                                    openTaskModal={openTaskModal}
                                    toggleRow={toggleRow}
                                    isExpanded={false}
                                    updateSubtask={updateSubtask}
                                    visibleColumns={visibleColumns}
                                    depth={depth + 1}
                                />
                            </div>
                        ))}
                    </div>
                )
            }
        </React.Fragment >
    );
};

export default React.memo(TaskRow);
