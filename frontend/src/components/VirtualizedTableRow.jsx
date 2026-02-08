// VirtualizedTableRow - Renders individual items in the virtualized list
import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import TaskRow from './TaskRow';
import { GRID_TEMPLATE } from '../constants/taskConstants';
import { toSkyISOString } from '../utils/dateUtils';

const VirtualizedTableRow = ({
    item,
    style,
    index,
    // Task Row Props
    users,
    boardId,
    statuses,
    priorities,
    tShirtSizes,
    expandedRows,
    toggleRow,
    openTaskModal,
    updateTask,
    updateTaskStatus,
    activeMenuTaskId,
    setActiveMenuTaskId,
    handleDeleteRequest,
    currentUser,
    // Add Row Props
    groupBy,
    isCreating,
    creatingGroup,
    setIsCreating,
    setCreatingGroup,
    newTaskTitle,
    setNewTaskTitle,
    createTask,
    getGroupColor,
    creationInputRef,
    groupCreationInputRef,
    updateSubtask
}) => {
    if (!item) return null;

    // Group Header Row
    if (item.type === 'group-header') {
        return (
            <div style={style}>
                <div
                    className="px-4 py-2 flex items-center gap-2 group cursor-pointer relative bg-slate-50 dark:bg-slate-900 border-b border-l-4 border-slate-200 dark:border-slate-700 box-border"
                    style={{ borderLeftColor: item.color || 'transparent', height: '100%' }}
                >
                    <ChevronDown size={14} className="text-gray-400" />
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                        {item.title}
                    </span>
                    <span className="text-xs text-gray-400 font-medium ml-1">
                        {item.count} items
                    </span>
                </div>
            </div>
        );
    }

    // Task Row
    if (item.type === 'task-row') {
        return (
            <div style={style} className="border-l-4 border-transparent box-border">
                <TaskRow
                    task={item.task}
                    index={index}
                    users={users}
                    boardId={boardId}
                    statuses={statuses}
                    priorities={priorities}
                    isExpanded={expandedRows.has(item.task.id)}
                    toggleRow={toggleRow}
                    openTaskModal={openTaskModal}
                    updateTask={updateTask}
                    updateTaskStatus={updateTaskStatus}
                    tShirtSizes={tShirtSizes}
                    gridTemplate={GRID_TEMPLATE}
                    activeMenuTaskId={activeMenuTaskId}
                    onToggleMenu={setActiveMenuTaskId}
                    onDelete={handleDeleteRequest}
                    currentUser={currentUser}
                    updateSubtask={updateSubtask}
                />
            </div>
        );
    }

    // Add New Task Row
    if (item.type === 'add-row') {
        const gKey = item.groupKey;
        const isThisGroupCreating = gKey ? (creatingGroup === gKey) : isCreating;

        const handleCreateTask = () => {
            if (!newTaskTitle.trim()) return;

            const defaultProps = { projectId: boardId, status: 'todo', priority: 'medium', labels: [] };
            if (groupBy === 'status') defaultProps.status = gKey;
            if (groupBy === 'priority') defaultProps.priority = gKey;
            if (groupBy === 'tShirtSize') defaultProps.tShirtSize = gKey;
            if (groupBy === 'labels' && gKey !== 'no_label') defaultProps.labels = [gKey];

            createTask({
                ...defaultProps,
                title: newTaskTitle,
                startDate: toSkyISOString(new Date())
            });
            setNewTaskTitle('');
        };

        return (
            <div
                style={{ ...style, borderLeftColor: gKey ? (getGroupColor(gKey) || '#e2e8f0') + '40' : 'transparent' }}
                className="border-l-4 border-transparent box-border"
            >
                <div
                    className={`grid transition-colors w-full h-full ${isThisGroupCreating ? 'border-b border-slate-200 dark:border-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                >
                    <div className={`${isThisGroupCreating ? 'border-r border-slate-200 dark:border-slate-700' : ''} py-3`}></div>
                    <div className={`px-4 py-3 ${isThisGroupCreating ? 'border-r border-slate-200 dark:border-slate-700' : ''}`}>
                        {isThisGroupCreating ? (
                            <div className="flex items-center gap-2">
                                <input
                                    ref={gKey ? groupCreationInputRef : creationInputRef}
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateTask();
                                        else if (e.key === 'Escape') gKey ? setCreatingGroup(null) : setIsCreating(false);
                                    }}
                                    onBlur={() => {
                                        handleCreateTask();
                                        gKey ? setCreatingGroup(null) : setIsCreating(false);
                                    }}
                                    placeholder="Görev adı yaz ve Enter'a bas..."
                                    className="w-full bg-white dark:bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    gKey ? setCreatingGroup(gKey) : setIsCreating(true);
                                    setNewTaskTitle('');
                                }}
                                aria-label={gKey ? 'Bu gruba yeni görev ekle' : 'Yeni görev ekle'}
                                className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors w-full text-left"
                            >
                                <Plus size={14} />
                                <span className="text-xs font-medium">{gKey ? 'Bu gruba ekle' : 'Yeni görev ekle'}</span>
                            </button>
                        )}
                    </div>
                    {/* Spacer columns */}
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className={`${isThisGroupCreating && i < 9 ? 'border-r border-slate-200 dark:border-slate-700' : ''} py-3`}></div>
                    ))}
                </div>
            </div>
        );
    }

    // Padding or fallback
    return <div style={style} />;
};

export default VirtualizedTableRow;

