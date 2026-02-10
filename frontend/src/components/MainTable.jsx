import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDataState, useDataActions } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import ModernTaskModal from './ModernTaskModal';
import MobileBoardView from './MobileBoardView';
import TaskRow from './TaskRow';
import ConfirmModal from './ui/ConfirmModal';
import { TableSkeleton } from './skeletons/TableSkeleton';
import EmptyState from './ui/EmptyState';

// Import shared constants
import { statuses, priorities, tShirtSizes, COLUMNS, generateGridTemplate, getDefaultColumnVisibility, EXPANDER_COLUMN_WIDTH, TASK_COLUMN_WIDTH } from '../constants/taskConstants';
import { filterProjectUsers } from '../utils/userHelper';

// GRID_TEMPLATE export removed as it's no longer used

const MainTable = ({ boardId, searchQuery, filters, groupBy }) => {
  const { tasks, tasksHasMore, users, projects, labels, loading } = useDataState();
  const { user: currentUser } = useAuth();

  // Column visibility state - Disabled as per user request
  const visibleColumns = getDefaultColumnVisibility();

  // REMOVED: Local masking/mapping of tasks. Reference stability is now handled by useTasks + entityHelpers.
  // const tasks = useMemo(...) -> Removed to prevent object reference recycling on every render.


  // NOTE: filteredTasks was removed - logic merged into boardTasks useMemo for performance

  const { fetchTasks, loadMoreTasks, fetchLabels, updateTaskStatus, updateTask, createTask, deleteTask, updateSubtask } = useDataActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialSection, setModalInitialSection] = useState('activity');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState(null);


  // Inline Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const creationInputRef = useRef(null);

  // Dynamic grid template based on visible columns
  const gridTemplate = useMemo(() => generateGridTemplate(visibleColumns), [visibleColumns]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data on board change - WITH CACHE CONTROL
  // Performance Fix: Only fetch if we don't have tasks for this board
  const hasBoardTasks = useMemo(() => {
    return tasks.some(t => t.projectId === Number(boardId));
  }, [tasks, boardId]);

  useEffect(() => {
    if (boardId) {
      // Skip fetch if we already have tasks for this board (cache hit)
      if (!hasBoardTasks) {
        fetchTasks(boardId);
      }
      // Labels are lightweight, always fetch for consistency
      fetchLabels(boardId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, hasBoardTasks, fetchTasks, fetchLabels]);

  // Project-based user filtering
  const projectUsers = useMemo(() => {
    const project = projects.find(p => p.id === Number(boardId));
    return filterProjectUsers(project, users);
  }, [users, boardId, projects]);

  // Filter tasks for current board - OPTIMIZED: Merged filteredTasks into this useMemo
  const boardTasks = useMemo(() => {
    // Step 1: Filter by board (was in filteredTasks, now direct)
    let filtered = tasks.filter(t => t.projectId === Number(boardId));

    filtered = filtered.filter(t => {
      // ONLY filter if it explicitly has a parent ID.
      // If parentTaskId is missing but it's listed in a parent's subtask array (inconsistent data),
      // we prefer showing it at the top level rather than hiding it entirely.
      return !(t.parentTaskId || t.parentId);
    });

    // Final dedup by ID just in case
    const seenIds = new Set();
    filtered = filtered.filter(t => {
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    });

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(lowerQuery) ||
        projectUsers.find(u => task.assignees?.includes(u.id))?.fullName?.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters) {
      if (filters.status?.length > 0) {
        filtered = filtered.filter(task => filters.status.includes(task.status));
      }
      if (filters.priority?.length > 0) {
        filtered = filtered.filter(task => filters.priority.includes(task.priority));
      }
      if (filters.assignee?.length > 0) {
        filtered = filtered.filter(task =>
          task.assigneeIds?.some(id => filters.assignee.includes(Number(id)))
        );
      }
      if (filters.labels?.length > 0) {
        filtered = filtered.filter(task =>
          task.labelIds?.some(id => filters.labels.includes(Number(id)))
        );
      }
    }

    return filtered;
  }, [tasks, boardId, searchQuery, filters, projectUsers]);

  // Deep Link Support: Open task modal if 'task' param is present
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId && tasks.length > 0) {
      // Search in all tasks (including subtasks) which are in the flat 'tasks' array
      const task = tasks.find(t => t.id === Number(taskId));
      if (task && (!selectedTask || selectedTask.id !== task.id)) {
        console.log(`[DeepLink] Auto-opening task ${taskId}: ${task.title}`);
        setSelectedTask(task);
        setIsModalOpen(true);
      }
    }
  }, [searchParams, tasks, selectedTask]);

  // Grouped Tasks
  const groupedTasks = useMemo(() => {
    if (!groupBy) return { 'all': boardTasks };

    const groups = {};
    if (groupBy === 'status') statuses.forEach(s => groups[s.id] = []);
    else if (groupBy === 'priority') priorities.forEach(p => groups[p.id] = []);
    else if (groupBy === 'tShirtSize') tShirtSizes.forEach(s => groups[s.id] = []);

    boardTasks.forEach(task => {
      let key = null;
      if (groupBy === 'status') key = task.status;
      else if (groupBy === 'priority') key = task.priority;
      else if (groupBy === 'tShirtSize') key = task.tShirtSize;

      if (groupBy === 'labels') {
        if (!task.labels || task.labels.length === 0) {
          if (!groups['no_label']) groups['no_label'] = [];
          groups['no_label'].push(task);
        } else {
          task.labels.forEach(labelId => {
            if (!groups[labelId]) groups[labelId] = [];
            groups[labelId].push(task);
          });
        }
        return;
      }

      if (groups[key] !== undefined) groups[key].push(task);
      else {
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      }
    });

    return groups;
  }, [boardTasks, groupBy]);

  // Default expand rows with subtasks
  // Default expand rows with subtasks - DISABLED per user request for List View
  // Subtasks should be collapsed by default in List view, but open in Gantt.
  /*
  useEffect(() => {
    if (boardTasks.length > 0) {
      const withSubtasks = boardTasks.filter(t => t.subtasks?.length > 0).map(t => t.id);
      setExpandedRows(new Set(withSubtasks));
    }
  }, [boardTasks.length > 0]); 
  */

  const getGroupTitle = (key) => {
    if (!groupBy) return null;
    if (groupBy === 'status') return statuses.find(s => s.id === key)?.label || 'Bilinmiyor';
    if (groupBy === 'priority') return priorities.find(p => p.id === key)?.label || 'Bilinmiyor';
    if (groupBy === 'tShirtSize') return tShirtSizes.find(s => s.id === key)?.label || '-';
    if (groupBy === 'labels') {
      if (key === 'no_label') return 'Etiketsiz';
      const label = labels.find(l => l.id === key);
      return label ? label.name : 'Bilinmiyor';
    }
    return key;
  };

  const getGroupColor = (key) => {
    if (!groupBy) return null;
    if (groupBy === 'status') return statuses.find(s => s.id === key)?.color;
    if (groupBy === 'priority') return priorities.find(p => p.id === key)?.color;
    if (groupBy === 'tShirtSize') return tShirtSizes.find(s => s.id === key)?.color;
    if (groupBy === 'labels') {
      if (key === 'no_label') return '#e2e8f0';
      return labels.find(l => l.id === key)?.color;
    }
    return null;
  };

  const toggleRow = (taskId) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) newExpanded.delete(taskId);
      else newExpanded.add(taskId);
      return newExpanded;
    });
  };

  const openTaskModal = (task, section = 'subtasks') => {
    setSelectedTask(task);
    setModalInitialSection(section);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (taskId) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const handleCreateTask = async (groupKey = null) => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      title: newTaskTitle,
      projectId: Number(boardId),
      status: groupBy === 'status' ? groupKey : 'todo',
      priority: groupBy === 'priority' ? groupKey : 'medium',
      tShirtSize: groupBy === 'tShirtSize' ? groupKey : null,
    };

    await createTask(newTask);
    setNewTaskTitle('');
    setIsCreating(false);
    setCreatingGroup(null);
  };

  // Get filtered users for this project
  const filteredUsers = useMemo(() => {
    const project = projects.find(p => p.id === Number(boardId));
    return filterProjectUsers(project, users);
  }, [projects, boardId, users]);

  // Flattened items for Virtualization (Performance Fix)
  const flattenedItems = useMemo(() => {
    const items = [];
    Object.entries(groupedTasks)
      .filter(([groupKey, tasks]) => tasks.length > 0 || groupKey === 'todo')
      .forEach(([groupKey, groupTaskList]) => {
        const groupColor = getGroupColor(groupKey);

        // 1. Group Header
        if (groupBy) {
          items.push({
            type: 'GROUP_HEADER',
            id: `group-${groupKey}`,
            groupKey,
            groupTitle: getGroupTitle(groupKey),
            groupColor,
            count: groupTaskList.length
          });
        }

        // 2. Tasks (Recursive in data, but flat here)
        const addTasksFlat = (taskList, depth = 0) => {
          taskList.forEach((task, index) => {
            items.push({
              type: 'TASK',
              id: `task-${groupKey}-${task.id}`, // Unique globally: task + group + id
              task,
              depth,
              index
            });
            if (expandedRows.has(task.id) && task.subtasks?.length > 0) {
              addTasksFlat(task.subtasks, depth + 1);
            }
          });
        };
        addTasksFlat(groupTaskList);

        // 3. Add Task Row
        if (groupBy !== 'status' || !['stuck', 'review', 'done'].includes(groupKey)) {
          items.push({
            type: 'ADD_TASK',
            id: `add-${groupKey}`,
            groupKey
          });
        }
      });

    // 4. Load More Row
    if (tasksHasMore) {
      items.push({
        type: 'LOAD_MORE',
        id: `load-more-${boardId}`
      });
    }

    return items;
  }, [groupedTasks, expandedRows, groupBy, tasksHasMore, boardId]);



  if (!boardId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#0f172a]">
        <EmptyState icon="project" title="Proje Seçin" description="Sol menüden bir proje seçin veya yeni bir proje oluşturun." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-white dark:bg-[#0f172a] p-8">
        <TableSkeleton />
      </div>
    );
  }

  if (boardTasks.length === 0 && (searchQuery || Object.values(filters || {}).some(f => f?.length > 0))) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#0f172a]">
        <EmptyState icon="search" title="Sonuç Bulunamadı" description="Arama kriterlerinize veya seçtiğiniz filtrelere uygun görev bulunamadı." />
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <MobileBoardView
          tasks={boardTasks}
          onTaskClick={(task) => openTaskModal(task)}
          onNewTaskClick={() => setIsCreating(true)}
        />
        {isModalOpen && selectedTask && (
          <ModernTaskModal task={selectedTask} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialSection={modalInitialSection} />
        )}
      </>
    );
  }

  return (
    <>
      {/* Main Scroll Container - Single container for both X and Y scroll */}
      <div
        className="h-full overflow-auto bg-white dark:bg-[#0f172a] relative flex flex-col"
        onClick={() => setActiveMenuTaskId(null)}
      >
        {/* Wide Content Container */}
        <div className="min-w-max flex flex-col">

          {/* Table Header - Sticky Top + First Column Sticky Left */}
          <div
            className="sticky top-0 z-50 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
            style={{ height: '40px' }}
          >
            <div className="grid items-center h-full" style={{ gridTemplateColumns: gridTemplate }}>

              {/* Column 1: Row Operations Stripe - Sticky Left (Total 2rem) */}
              <div
                className="sticky left-0 z-[60] bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full flex items-center justify-center bg-clip-padding"
                style={{ width: EXPANDER_COLUMN_WIDTH, minWidth: EXPANDER_COLUMN_WIDTH, maxWidth: EXPANDER_COLUMN_WIDTH, boxSizing: 'border-box' }}
              >
                <div className="w-1 h-full shrink-0"></div>
              </div>

              {/* Column 2: Task Title Header - Sticky Left (Starts at 2rem) */}
              <div
                className="sticky z-[60] bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 font-semibold text-[12px] tracking-tight text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 flex items-center h-full bg-clip-padding"
                style={{ left: EXPANDER_COLUMN_WIDTH, width: TASK_COLUMN_WIDTH, minWidth: TASK_COLUMN_WIDTH, maxWidth: TASK_COLUMN_WIDTH, boxSizing: 'border-box' }}
              >
                Görev
              </div>

              {/* Dynamic Columns */}
              {COLUMNS.map(col => visibleColumns[col.id] && (
                <div
                  key={`header-${col.id}`}
                  className="px-4 font-semibold text-[12px] tracking-tight text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 h-full flex items-center truncate"
                >
                  {col.label}
                </div>
              ))}

              {/* Actions Column */}
              <div className="bg-slate-100 dark:bg-slate-800 h-full border-r border-slate-200 dark:border-slate-700 bg-clip-padding" style={{ boxSizing: 'border-box' }}></div>
            </div>
          </div>

          {/* Table Body - Stable Hybrid (No Virtualization) */}
          <div className="flex-1">
            <AnimatePresence initial={false}>
              {flattenedItems.map((item, index) => {
                if (item.type === 'GROUP_HEADER') {
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="z-10 group/header relative"
                    >
                      <div
                        className="grid items-stretch border-b border-slate-200 dark:border-slate-700 shrink-0"
                        style={{
                          height: '32px',
                          gridTemplateColumns: gridTemplate,
                          borderTop: `1px solid ${item.groupColor ? item.groupColor + '20' : 'transparent'}`,
                          background: item.groupColor
                            ? `linear-gradient(to right, ${item.groupColor}0a 0%, ${item.groupColor}02 100%)`
                            : 'none'
                        }}
                      >
                        {/* 1. Group Indicator - Sticky Left */}
                        <div
                          className="sticky left-0 z-30 h-full border-r border-slate-200 dark:border-slate-700 flex items-stretch bg-white dark:bg-[#0f172a] bg-clip-padding"
                          style={{ width: EXPANDER_COLUMN_WIDTH, minWidth: EXPANDER_COLUMN_WIDTH, maxWidth: EXPANDER_COLUMN_WIDTH, boxSizing: 'border-box' }}
                        >
                          <div
                            className="w-1 h-full shrink-0"
                            style={{ backgroundColor: item.groupColor }}
                          />
                          <div className="flex-1" />
                        </div>

                        {/* 2. Group Title - Sticky Left */}
                        <div
                          className="sticky z-30 px-4 flex items-center gap-2 overflow-hidden border-r border-slate-200 dark:border-slate-700 h-full min-w-0 bg-white dark:bg-[#0f172a] bg-clip-padding"
                          style={{ left: EXPANDER_COLUMN_WIDTH, width: TASK_COLUMN_WIDTH, minWidth: TASK_COLUMN_WIDTH, maxWidth: TASK_COLUMN_WIDTH, boxSizing: 'border-box' }}
                        >
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate capitalize tracking-tight">
                            {item.groupTitle}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md min-w-[20px] text-center bg-slate-100/50 dark:bg-slate-800/50">
                            {item.count}
                          </span>
                        </div>

                        {/* Dynamic Empty Cells for Header Alignment */}
                        {COLUMNS.map(col => visibleColumns[col.id] && (
                          <div key={`group-empty-${col.id}`} className="h-full border-r border-slate-200 dark:border-slate-700 bg-clip-padding" style={{ boxSizing: 'border-box' }} />
                        ))}
                        <div className="h-full bg-clip-padding border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }} />
                      </div>
                    </motion.div>
                  );
                }

                if (item.type === 'TASK') {
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      style={{ height: item.depth > 0 ? '42px' : '52px' }}
                    >
                      <TaskRow
                        task={item.task}
                        index={item.index}
                        users={filteredUsers}
                        boardId={boardId}
                        workspaceId={projects.find(p => p.id === Number(boardId))?.departmentId || null}
                        statuses={statuses}
                        priorities={priorities}
                        tShirtSizes={tShirtSizes}
                        gridTemplate={gridTemplate}
                        isExpanded={expandedRows.has(item.task.id)}
                        toggleRow={toggleRow}
                        openTaskModal={openTaskModal}
                        updateTask={updateTask}
                        updateTaskStatus={updateTaskStatus}
                        activeMenuTaskId={activeMenuTaskId}
                        onToggleMenu={setActiveMenuTaskId}
                        onDelete={handleDeleteRequest}
                        currentUser={currentUser}
                        updateSubtask={updateSubtask}
                        visibleColumns={visibleColumns}
                        depth={item.depth}
                        isVirtualized={false}
                      />
                    </motion.div>
                  );
                }

                if (item.type === 'ADD_TASK') {
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div
                        className="grid items-stretch hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-200 dark:border-slate-700 shrink-0"
                        style={{ height: '42px', gridTemplateColumns: gridTemplate }}
                      >
                        <div
                          className="sticky left-0 z-30 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-700 flex items-stretch h-full bg-clip-padding"
                          style={{ width: EXPANDER_COLUMN_WIDTH, minWidth: EXPANDER_COLUMN_WIDTH, maxWidth: EXPANDER_COLUMN_WIDTH, boxSizing: 'border-box' }}
                        >
                          <div className="w-1 h-full shrink-0"></div>
                          <div className="flex-1"></div>
                        </div>
                        <div
                          className="sticky z-30 bg-white dark:bg-[#0f172a] px-4 py-0 flex items-center border-r border-slate-200 dark:border-slate-700 h-full bg-clip-padding"
                          style={{ left: EXPANDER_COLUMN_WIDTH, width: TASK_COLUMN_WIDTH, minWidth: TASK_COLUMN_WIDTH, maxWidth: TASK_COLUMN_WIDTH, boxSizing: 'border-box' }}
                          onClick={() => { setCreatingGroup(item.groupKey); setIsCreating(true); }}
                        >
                          {isCreating && creatingGroup === item.groupKey ? (
                            <input
                              ref={creationInputRef}
                              type="text"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateTask(item.groupKey);
                                if (e.key === 'Escape') { setIsCreating(false); setNewTaskTitle(''); }
                              }}
                              onBlur={() => { if (!newTaskTitle.trim()) { setIsCreating(false); setNewTaskTitle(''); } }}
                              placeholder="Yeni görev başlığı..."
                              className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors">
                              <Plus size={14} />
                              <span className="text-[13px] tracking-tight">Görev ekle</span>
                            </div>
                          )}
                        </div>
                        {COLUMNS.map(col => visibleColumns[col.id] && (
                          <div key={`add-task-empty-${col.id}`} className="h-full border-r border-slate-200 dark:border-slate-700 bg-clip-padding" style={{ boxSizing: 'border-box' }} />
                        ))}
                        <div className="h-full bg-clip-padding border-r border-slate-200 dark:border-slate-700" style={{ boxSizing: 'border-box' }}></div>
                      </div>
                    </motion.div>
                  );
                }
                if (item.type === 'LOAD_MORE') {
                  return (
                    <motion.div
                      key={item.id}
                      className="flex justify-center py-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/10"
                    >
                      <button
                        onClick={() => loadMoreTasks(boardId)}
                        className="px-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-2 shadow-sm"
                      >
                        <ChevronDown size={14} />
                        DAHA FAZLA YÜKLE
                      </button>
                    </motion.div>
                  );
                }
                return null;
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {
        isModalOpen && selectedTask && (
          <ModernTaskModal
            task={selectedTask}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTask(null);
              // Clear URL param
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('task');
              // Use navigate to replace URL without reload, or setSearchParams
              // setSearchParams is available from hook
              setSearchParams(newParams);
            }}
            initialSection={modalInitialSection}
          />
        )
      }

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Görevi Sil"
        message="Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="İptal"
        type="danger"
      />
    </>
  );
};

export default MainTable;
