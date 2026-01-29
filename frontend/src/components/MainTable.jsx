import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useDataState, useDataActions } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import ModernTaskModal from './ModernTaskModal';
import MobileBoardView from './MobileBoardView';
import TaskRow from './TaskRow';
import VirtualizedTableRow from './VirtualizedTableRow';
import ConfirmModal from './ui/ConfirmModal';

import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { TableSkeleton } from './skeletons/TableSkeleton';
import EmptyState from './ui/EmptyState';



// Import shared constants
import { statuses, priorities, tShirtSizes, GRID_TEMPLATE } from '../constants/taskConstants';

// Re-export for backward compatibility
export { GRID_TEMPLATE };

const MainTable = ({ boardId, searchQuery, filters, groupBy }) => {
  const { tasks: rawTasks, users, projects, labels, loading } = useDataState();


  // Normalize tasks (Backend returns objects, Frontend expects IDs)
  const tasks = React.useMemo(() => {
    return rawTasks.map(t => ({
      ...t,
      _id: t._id || t.id || t.Id,
      id: t._id || t.id || t.Id,
      dueDate: t.dueDate || t.DueDate,
      startDate: t.startDate || t.StartDate,
      assignees: Array.isArray(t.assignees) ? t.assignees.map(a => {
        if (typeof a === 'object' && a !== null) return a.userId || a.UserId || a.id || a.Id || a.uid;
        return a;
      }) : [],
      labels: Array.isArray(t.labels) ? t.labels.map(l => {
        if (typeof l === 'object' && l !== null) return l.labelId || l.LabelId || l.id || l.Id;
        return l;
      }) : []

    }));
  }, [rawTasks]);

  const { user: currentUser } = useAuth();
  const { fetchTasks, fetchLabels, updateTaskStatus, updateTask, deleteProject, createTask, deleteTask, updateSubtask } = useDataActions();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialSection, setModalInitialSection] = useState('activity');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Inline Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(null); // Which group is being added to
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const creationInputRef = useRef(null);
  const groupCreationInputRef = useRef(null);

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- Deletion & Menu State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState(null); // Ensure single menu open
  // -----------------------------

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Optimize data fetching: Only fetch if needed
  React.useEffect(() => {
    if (boardId) {
      // Fetch tasks if needed
      const hasTasks = tasks.some(t => t.projectId === Number(boardId));
      if (!hasTasks) {
        // Fetching tasks for boardId
        fetchTasks(boardId);
      }
      // Always fetch or refresh labels for the current board
      fetchLabels(boardId);
    }
  }, [boardId, fetchTasks, fetchLabels]);

  const boardTasks = React.useMemo(() => {
    if (!boardId) return [];
    let filtered = tasks.filter(t => t.projectId === Number(boardId));

    // Apply Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(lowerQuery) ||
        users.find(u => task.assignees?.includes(u._id))?.fullName?.toLowerCase().includes(lowerQuery)
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
          task.assignees?.some(assigneeId => filters.assignee.includes(assigneeId))
        );
      }
      if (filters.labels?.length > 0) {
        filtered = filtered.filter(task =>
          task.labels?.some(labelId => filters.labels.includes(labelId))
        );
      }
    }

    return filtered;
  }, [tasks, boardId, searchQuery, filters, users]);

  // Grouped Tasks Calculation
  const groupedTasks = React.useMemo(() => {
    if (!groupBy) return { 'all': boardTasks };

    const groups = {};

    // Initialize groups based on groupBy type to ensure order and empty groups
    if (groupBy === 'status') {
      statuses.forEach(s => groups[s.id] = []);
    } else if (groupBy === 'priority') {
      priorities.forEach(p => groups[p.id] = []);
    } else if (groupBy === 'tShirtSize') {
      tShirtSizes.forEach(s => groups[s.id] = []);
    }

    // Distribute tasks
    boardTasks.forEach(task => {
      let key = null;
      if (groupBy === 'status') key = task.status;
      else if (groupBy === 'priority') key = task.priority;
      else if (groupBy === 'tShirtSize') key = task.tShirtSize;

      // Handle Labels specially (tasks can be in multiple groups or just one?)
      // Implementation: Duplicate for each label if needed, or group by "First Label"
      // User requested "Etiket" grouping. Let's group by EACH label.
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
        return; // Early return for labels because of multi-grouping nature
      }

      // Default grouping
      if (groups[key] !== undefined) {
        groups[key].push(task);
      } else {
        // Create dynamic group if not exists (e.g. for labels or unknown values)
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      }
    });

    return groups;
  }, [boardTasks, groupBy]);

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

  // --- Virtualization Helpers ---
  const flatItems = React.useMemo(() => {
    const items = [];
    if (groupBy) {
      Object.entries(groupedTasks).forEach(([groupKey, groupTasks]) => {
        // 1. Group Header
        items.push({
          type: 'group-header',
          groupKey,
          title: getGroupTitle(groupKey),
          color: getGroupColor(groupKey),
          count: groupTasks.length
        });

        // 2. Tasks
        groupTasks.forEach(task => {
          items.push({
            type: 'task-row',
            task,
            groupKey,
            id: task._id
          });
        });

        // 3. Add Item Row for this group
        items.push({
          type: 'add-row',
          groupKey,
          id: `add-${groupKey}`
        });
      });
    } else {
      // 1. Tasks
      boardTasks.forEach(task => {
        items.push({
          type: 'task-row',
          task,
          id: task._id
        });
      });

      // 2. Global Add Row
      items.push({
        type: 'add-row',
        id: 'add-global'
      });
    }

    // Bottom padding
    items.push({ type: 'padding', id: 'bottom-padding' });

    return items;
  }, [groupedTasks, boardTasks, groupBy, labels, tasks]);

  const getItemSize = React.useCallback((index) => {
    const item = flatItems[index];
    if (!item) return 0;

    if (item.type === 'group-header') return 40;
    if (item.type === 'add-row') return 54;
    if (item.type === 'padding') return 40;

    if (item.type === 'task-row') {
      const isExpanded = expandedRows.has(item.task._id);
      if (isExpanded && item.task.subtasks?.length > 0) {
        // Base row (56px) + (subtask count * 40px)
        return 56 + (item.task.subtasks.length * 40);
      }
      return 56;
    }

    return 56;
  }, [flatItems, expandedRows]);

  const listRef = useRef(null);

  // Recalculate heights when rows expand or item list changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [expandedRows, flatItems]);
  // -----------------------------



  const getStatusColor = React.useCallback((statusId) => {
    return statuses.find(s => s.id === statusId)?.color || '#c4c4c4';
  }, []);

  const getPriorityData = React.useCallback((priorityId) => {
    return priorities.find(p => p.id === priorityId) || priorities[0];
  }, []);

  const getAssignees = React.useCallback((assigneeIds) => {
    return users.filter(u => assigneeIds?.includes(u.id || u._id));
  }, [users]);

  const toggleRow = React.useCallback((taskId) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return newExpanded;
    });
  }, []);

  const openTaskModal = React.useCallback((task, section = 'subtasks') => {
    setSelectedTask(task);
    setModalInitialSection(section);
    setIsModalOpen(true);
  }, []);

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

  if (!boardId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#0f172a]">
        <EmptyState
          icon="project"
          title="Proje Seçin"
          description="Sol menüden bir proje seçin veya yeni bir proje oluşturun."
        />
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
        <EmptyState
          icon="search"
          title="Sonuç Bulunamadı"
          description="Arama kriterlerinize veya seçtiğiniz filtrelere uygun görev bulunamadı."
        />
      </div>
    );
  }

  // Mobile View Render
  if (isMobile) {
    return (
      <>
        <MobileBoardView
          tasks={boardTasks}
          onTaskClick={(task) => openTaskModal(task)}
          onNewTaskClick={() => setShowNewTaskModal(true)}
          getStatusColor={getStatusColor}
          getPriorityData={getPriorityData}
          getAssignees={getAssignees}
          searchQuery={searchQuery}
        />

        {/* Task Modal */}
        {isModalOpen && selectedTask && (
          <ModernTaskModal
            task={selectedTask}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            initialSection={modalInitialSection}
          />
        )}

        {/* New Task Modal */}
        {showNewTaskModal && (
          <NewTaskModal
            isOpen={showNewTaskModal}
            onClose={() => setShowNewTaskModal(false)}
            boardId={boardId}
          />
        )}
      </>
    );
  }

  // --- Row Renderer (uses VirtualizedTableRow) ---
  const Row = ({ index, style }) => (
    <VirtualizedTableRow
      item={flatItems[index]}
      style={style}
      index={index}
      users={users}
      boardId={boardId}
      statuses={statuses}
      priorities={priorities}
      tShirtSizes={tShirtSizes}
      expandedRows={expandedRows}
      toggleRow={toggleRow}
      openTaskModal={openTaskModal}
      updateTask={updateTask}
      updateTaskStatus={updateTaskStatus}
      activeMenuTaskId={activeMenuTaskId}
      setActiveMenuTaskId={setActiveMenuTaskId}
      handleDeleteRequest={handleDeleteRequest}
      currentUser={currentUser}
      groupBy={groupBy}
      isCreating={isCreating}
      creatingGroup={creatingGroup}
      setIsCreating={setIsCreating}
      setCreatingGroup={setCreatingGroup}
      newTaskTitle={newTaskTitle}
      setNewTaskTitle={setNewTaskTitle}
      createTask={createTask}
      getGroupColor={getGroupColor}
      creationInputRef={creationInputRef}
      groupCreationInputRef={groupCreationInputRef}
      updateSubtask={updateSubtask}
    />
  );

  return (

    <>
      <div
        className="h-full overflow-x-auto overflow-y-hidden bg-white dark:bg-[#0f172a] relative flex flex-col"
        onClick={() => setActiveMenuTaskId(null)} // Click anywhere closes menus
      >
        <div className="flex-1 min-w-[120rem] inline-block align-top relative flex flex-col">
          {/* Table Header using CSS GRID */}
          <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-20 w-full shrink-0 box-border">

            <div className="grid border-l-4 border-transparent w-full" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
              <div className="flex items-center justify-center py-2 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                {/* Expander Column Header */}
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                Görev
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                Durum
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                Öncelik
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                T-Shirt Size
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                Atanan
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                Son Tarih
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                Etiketler
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center">
                İlerleme
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                Dosyalar
              </div>
              <div className="px-4 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                Oluşturan
              </div>
              <div className="bg-gray-50 dark:bg-gray-900"></div>
            </div>
          </div>

          {/* Virtualized List Body */}
          <div className="flex-1 min-w-full">
            <AutoSizer>
              {({ height, width }) => (
                <List
                  ref={listRef}
                  height={height}
                  itemCount={flatItems.length}
                  itemSize={getItemSize}
                  width={width}
                  className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 overflow-y-scroll"
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && selectedTask && (
        <ModernTaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialSection={modalInitialSection}
        />
      )}

      {/* New Task Modal (Global Fab if needed, but here mostly for mobile trigger or unused) */}

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
