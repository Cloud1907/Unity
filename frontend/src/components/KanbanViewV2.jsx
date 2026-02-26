import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, MoreHorizontal, User, Calendar, GitMerge, MessageSquare, Trash2, TrendingUp, Link } from 'lucide-react';
import { tasksAPI } from '../services/api';
import { toast } from 'sonner';
import { useDataState, useDataActions } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ModernTaskModal from './ModernTaskModal';
import NewTaskModal from './NewTaskModal';
import InlineLabelPicker from './InlineLabelPicker';
import InlineAssigneePicker from './InlineAssigneePicker';
import InlineTextEdit from './InlineTextEdit';
import ConfirmModal from './ui/ConfirmModal';
import confetti from 'canvas-confetti';
import { KanbanSkeleton } from './skeletons/KanbanSkeleton';
import EmptyState from './ui/EmptyState';
import { getAvatarUrl, getUserColor, getInitials } from '../utils/avatarHelper';
import { filterProjectUsers } from '../utils/userHelper';
import { toSkyISOString } from '../utils/dateUtils';
import { subDays, subMonths, isAfter, parseISO } from 'date-fns';
import { STATUS_COLORS } from './Kanban/constants';
import { celebrateTask } from './Kanban/helpers';
import CompactTaskCard from './Kanban/CompactTaskCard';

const KanbanViewV2 = ({ boardId, searchQuery, filters, completedFilter = '7days' }) => {
  const { tasks, users: allUsers, projects, loading, labels } = useDataState();
  const { fetchTasks, fetchLabels, updateTaskStatus, updateTask, deleteTask, createTask } = useDataActions();
  const { user: currentUser } = useAuth();

  // Project-based user filtering
  const projectUsers = React.useMemo(() => {
    const project = projects.find(p => p.id === Number(boardId));
    return filterProjectUsers(project, allUsers);
  }, [allUsers, boardId, projects]);

  // Extract workspace ID for user filtering
  const workspaceId = React.useMemo(() => {
    const project = projects.find(p => p.id === Number(boardId));
    return project?.departmentId || null;
  }, [boardId, projects]);
  
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep Link Support: Open task modal if 'task' param is present
  const deepLinkHandled = React.useRef(false);
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (!taskId) {
      deepLinkHandled.current = false; // Reset when param is gone
      return;
    }
    if (deepLinkHandled.current) return;
    if (tasks.length === 0) return;

    const task = tasks.find(t => t.id === Number(taskId));
    if (task) {
      console.log(`[Kanban DeepLink] Auto-opening task ${taskId}`);
      deepLinkHandled.current = true;
      setSelectedTask(task);
      if (task.subtasks?.length > 0) setModalInitialSection('subtasks');
      else setModalInitialSection('activity');
      setIsDetailOpen(true);
    }
  }, [searchParams, tasks]);

  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [modalInitialSection, setModalInitialSection] = useState('subtasks');

  // New Task Modal State
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('todo'); // Default status

  // Confirm Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Active Menu State (LIFTED)
  const [activeMenuTaskId, setActiveMenuTaskId] = useState(null);

  // Track newly created task for auto-focus
  const [justCreatedTaskId, setJustCreatedTaskId] = useState(null);

  // Per-component fetch removed to avoid infinite loops on empty boards.
  // DataContext handles the global initial fetch.
  /*
  useEffect(() => {
    if (boardId) {
      // Optimize: Only fetch if we don't have tasks for this board
      const hasTasks = tasks.some(task => task.projectId === Number(boardId));
      if (!hasTasks) {
        fetchTasks(boardId);
      }
      // Ensure labels are loaded centrally - Guarded to prevent loop
      const hasLabels = labels?.some(l => l.projectId === Number(boardId));
      if (!hasLabels) {
        fetchLabels(boardId);
      }
    }
  }, [boardId, fetchTasks, fetchLabels, tasks, labels]);
  */

  const filteredTasks = React.useMemo(() => {
    let filtered = tasks.filter(task => task.projectId === Number(boardId));

    // New: Completed Task Date Filter
    if (completedFilter !== 'all') {
        filtered = filtered.filter(t => {
            if (t.status !== 'done') return true; // Keep active tasks

            const completedDate = t.completedAt || t.updatedAt;
            if (!completedDate) return false; 

            const now = new Date();
            let thresholdDate;

            switch (completedFilter) {
                case '7days': thresholdDate = subDays(now, 7); break;
                case '1month': thresholdDate = subMonths(now, 1); break;
                case '3months': thresholdDate = subMonths(now, 3); break;
                default: return true;
            }

            return isAfter(parseISO(completedDate), thresholdDate);
        });
    }

    // Apply Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(lowerQuery) ||
        projectUsers.find(u => task.assigneeIds?.includes(u.id))?.fullName?.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply Filters
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
  }, [tasks, boardId, searchQuery, filters, projectUsers, completedFilter]);


  const tasksByStatus = React.useMemo(() => {
    const partitioned = {
      todo: [],
      working: [],
      review: [],
      done: [],
      stuck: []
    };
    filteredTasks.forEach(task => {
      if (partitioned[task.status]) {
        partitioned[task.status].push(task);
      }
    });
    return partitioned;
  }, [filteredTasks]);

  const columns = React.useMemo(() => [
    { id: 'todo', title: 'Yapılacak', color: STATUS_COLORS.todo.bg, lightBg: STATUS_COLORS.todo.lightBg },
    { id: 'working', title: 'Devam Ediyor', color: STATUS_COLORS.working.bg, lightBg: STATUS_COLORS.working.lightBg },
    { id: 'review', title: 'İncelemede', color: STATUS_COLORS.review.bg, lightBg: STATUS_COLORS.review.lightBg },
    { id: 'done', title: 'Tamamlandı', color: STATUS_COLORS.done.bg, lightBg: STATUS_COLORS.done.lightBg },
    { id: 'stuck', title: 'Takıldı', color: STATUS_COLORS.stuck.bg, lightBg: STATUS_COLORS.stuck.lightBg }
  ], []);

  const handleDragStart = React.useCallback((e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = React.useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = React.useCallback((e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Performance optimization: prevent unnecessary re-renders
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  }, [dragOverColumn]);

  const handleDragLeave = React.useCallback(() => {
    // Optional: add logic if needed, but keeping it simple for now
    // setDragOverColumn(null) causes flickering if not careful with boundaries
  }, []);

  const handleDrop = React.useCallback(async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== newStatus) {
      const oldStatus = draggedTask.status;

      // Eğer "done" kolonuna bırakıldıysa kutla!
      if (newStatus === 'done' && oldStatus !== 'done') {
        celebrateTask();
      }

      await updateTaskStatus(draggedTask.id, newStatus);
    }

    setDraggedTask(null);
  }, [draggedTask, updateTaskStatus]);

  const handleStatusChange = React.useCallback(async (taskId, newStatus) => {
    await updateTaskStatus(taskId, newStatus);
  }, [updateTaskStatus]);

  const handleUpdateTask = React.useCallback(async (taskId, data) => {
    await updateTask(taskId, data);
  }, [updateTask]);

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

  const handleTaskClick = (task, section = 'subtasks') => {
    setSelectedTask(task);
    setModalInitialSection(section);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTask(null);
    
    // Clear URL param without triggering React re-render
    const url = new URL(window.location.href);
    if (url.searchParams.has('task')) {
      url.searchParams.delete('task');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  const handleAddTask = async (columnId) => {
    const newTask = {
      title: 'Yeni Görev',
      projectId: boardId,
      status: columnId,
      priority: 'medium',
      assignees: [],
      progress: 0,
      labels: [],
      subtasks: [],
      startDate: toSkyISOString(new Date())
    };

    // Wait for creation to get the real ID
    const result = await createTask(newTask);

    if (result.success) {
      // Set the REAL task ID to trigger auto-focus
      setJustCreatedTaskId(result.data.id);
      
      // Clear the focus target after a delay
      setTimeout(() => setJustCreatedTaskId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 relative">
        <KanbanSkeleton />
      </div>
    );
  }

  if (filteredTasks.length === 0 && (searchQuery || Object.values(filters || {}).some(f => f?.length > 0))) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <EmptyState
          icon="search"
          title="Sonuç Bulunamadı"
          description="Arama kriterlerinize veya seçtiğiniz filtrelere uygun görev bulunamadı."
        />
      </div>
    );
  }

  return (
    <div
      className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 relative overflow-visible"
      onClick={() => setActiveMenuTaskId(null)} // Click anywhere closes menus
    >
      {/* Kanban Board */}
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-max pb-4">
          {columns.map(column => {
            const columnTasks = tasksByStatus[column.id] || [];
            const isDropTarget = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className={`flex flex-col w-[270px] rounded-2xl ${isDropTarget
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                  : 'bg-transparent border-transparent'
                  } border h-full overflow-hidden transition-colors duration-300`}
                style={{
                  backgroundColor: isDropTarget ? undefined : `${column.color}0D` // ~5% opacity for premium transparent feel
                }}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header - Sticky & Monday.com style */}
                <div
                  className="sticky top-0 z-10 px-4 py-3 bg-gray-50/95 dark:bg-slate-900/95 border-b border-gray-200 dark:border-slate-800 shadow-sm"
                  style={{
                    borderLeft: `4px solid ${column.color}`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {column.title}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white min-w-[24px] text-center shadow-sm"
                        style={{ backgroundColor: column.color }}
                      >
                        {columnTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddTask(column.id)}
                      className="p-1.5 hover:bg-white/80 dark:hover:bg-slate-700/80 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 group"
                    >
                      <Plus size={18} className="text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400" />
                    </button>
                  </div>
                </div>


                {/* Tasks Area - Independent Scroll */}
                <div
                  className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800 transition-colors duration-200 ${isDropTarget ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-transparent'}`}
                >
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {columnTasks.map(task => (
                        <motion.div
                          key={task.id}
                          layout
                          layoutId={task.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                          transition={{ duration: 0.2, type: "spring", stiffness: 200, damping: 25 }}
                        >
                          <CompactTaskCard
                            task={task}
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            isDragging={draggedTask?.id === task.id}

                            users={projectUsers}
                            projectId={boardId}
                            workspaceId={workspaceId}
                            onStatusChange={handleStatusChange}
                            onTaskClick={handleTaskClick}
                            onUpdate={handleUpdateTask}
                            onDelete={handleDeleteRequest}
                            activeMenuTaskId={activeMenuTaskId}
                            onToggleMenu={setActiveMenuTaskId}
                            autoFocus={task.id === justCreatedTaskId}
                            currentUser={currentUser}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Empty State - CLICKABLE */}
                  {columnTasks.length === 0 && !isDropTarget && (
                    <button
                      onClick={() => handleAddTask(column.id)}
                      className="w-full text-center py-10 px-4 opacity-70 hover:opacity-100 bg-dashed border-2 border-dashed border-gray-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl mt-2 transition-all group"
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 flex items-center justify-center transition-colors">
                        <Plus size={24} className="text-gray-400 dark:text-gray-600 group-hover:text-blue-500" strokeWidth={1.5} />
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium capitalize tracking-wide">Görev Ekle</p>
                    </button>
                  )}

                  {/* Bottom Add Button (For non-empty lists) */}
                  {columnTasks.length > 0 && !isDropTarget && (
                     <button
                        onClick={() => handleAddTask(column.id)}
                        className="w-full py-2 mt-2 flex items-center justify-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors dashed-border-top"
                      >
                        <Plus size={14} />
                        Görev Ekle
                      </button>
                  )}

                  {/* Drop Zone Indicator */}
                  {isDropTarget && (
                    <div
                      className="border-2 border-dashed rounded-xl p-10 text-center animate-pulse mt-4 bg-white/50 dark:bg-slate-800/50"
                      style={{ borderColor: column.color, color: column.color }}
                    >
                      <div className="text-xs font-black uppercase tracking-widest">
                        Bırak
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Modal - Centered (like MainTable) */}
      {
        isDetailOpen && selectedTask && (
          <ModernTaskModal
            task={selectedTask}
            isOpen={isDetailOpen}
            onClose={handleCloseDetail}
            initialSection={modalInitialSection}
          />
        )
      }

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        projectId={boardId}
        initialStatus={newTaskStatus}
      />

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
    </div >
  );
};

export default KanbanViewV2;
