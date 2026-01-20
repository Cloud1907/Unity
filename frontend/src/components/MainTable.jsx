import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MoreHorizontal, Plus, Calendar, User, Tag, TrendingUp, ChevronDown, X, GitMerge, MessageSquare, Maximize2 } from 'lucide-react';
import { useDataState, useDataActions } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Calendar as CalendarComponent } from './ui/calendar';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ModernTaskModal from './ModernTaskModal';
import NewTaskModal from './NewTaskModal';
import InlineLabelPicker from './InlineLabelPicker';
import MobileBoardView from './MobileBoardView';
import TaskRow from './TaskRow';
import ConfirmModal from './ui/ConfirmModal';
import pkg from '../../package.json';
import { TableSkeleton } from './skeletons/TableSkeleton';
import EmptyState from './ui/EmptyState';

// Monday.com benzeri durum renkleri (Daha canlı ve pastel)
const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#c4c4c4' },      // Gri
  { id: 'working', label: 'Devam Ediyor', color: '#fdab3d' }, // Turuncu
  { id: 'stuck', label: 'Takıldı', color: '#e2445c' },        // Kırmızı
  { id: 'done', label: 'Tamamlandı', color: '#00c875' },      // Yeşil
  { id: 'review', label: 'İncelemede', color: '#579bfc' }     // Mavi
];

// Öncelik renkleri (Daha ciddi ve koyu tonlar)
// Öncelik renkleri (Daha kibar, pastel ve şık)
const priorities = [
  { id: 'low', label: 'Düşük', color: '#eef2f5', textColor: '#5f6b7c', icon: '↓' },       // Çok Açık Gri
  { id: 'medium', label: 'Orta', color: '#e5e9f5', textColor: '#4051b5', icon: '−' },     // Açık Çivit Mavisi
  { id: 'high', label: 'Yüksek', color: '#fff0e5', textColor: '#ff6b00', icon: '↑' },     // Açık Turuncu
  { id: 'urgent', label: 'Acil', color: '#ffe5e9', textColor: '#d91d4a', icon: '⇈' }      // Açık Kırmızı
];

// T-Shirt Sizes
const tShirtSizes = [
  { id: null, label: '-', color: '#f3f4f6', textColor: '#9ca3af' }, // Unset state
  { id: 'small', label: 'Small (1-2 Weeks)', color: '#34d399', textColor: '#ffffff' },
  { id: 'medium', label: 'Medium (2-4 Weeks)', color: '#9ca3af', textColor: '#ffffff' },
  { id: 'large', label: 'Large (4-8 Weeks)', color: '#a78bfa', textColor: '#ffffff' },
  { id: 'xlarge', label: 'X-Large (2-3 Months)', color: '#fb923c', textColor: '#ffffff' },
  { id: 'xxlarge', label: 'XX-Large (3-6+ Months)', color: '#f472b6', textColor: '#ffffff' }
];

// CSS GRID TEMPLATE DEFINITION
// Ensures strict alignment between Header and Body
export const GRID_TEMPLATE = "2rem minmax(300px, 1fr) 10rem 8rem 12rem 10rem 7rem 12rem 7rem 5rem 3rem";

const MainTable = ({ boardId, searchQuery, filters, groupBy }) => {
  const { tasks, users, projects, labels, loading } = useDataState();
  const { fetchTasks, fetchLabels, updateTaskStatus, updateTask, deleteProject, createTask, deleteTask } = useDataActions();
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
        console.log('🔄 Fetching tasks for boardId:', boardId);
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

  return (
    <>
      <div
        className="flex-1 overflow-auto bg-white dark:bg-[#0f172a] relative"
        onClick={() => setActiveMenuTaskId(null)} // Click anywhere closes menus
      >
        {/* 🎯 VERSİYON */}
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-lg animate-fade-in">
          v{pkg.version} 👤
        </div>

        <div className="min-w-full inline-block align-top">
          {/* Table Header using CSS GRID */}
          <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10 w-full">
            <div className="grid border-l-4 border-transparent w-full" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
              <div className="flex items-center justify-center py-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {/* Expander Column Header */}
              </div>
              <div className="px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                Görev
              </div>
              <div className="px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                Durum
              </div>
              <div className="px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                Öncelik
              </div>
              <div className="px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                T-Shirt Size
              </div>
              <div className="px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                Atanan
              </div>
              <div className="px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                Son Tarih
              </div>
              <div className="px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                Etiketler
              </div>
              <div className="px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                İlerleme
              </div>
              <div className="px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                Dosyalar
              </div>
              <div className="bg-gray-50 dark:bg-gray-900"></div>
            </div>
          </div>

          {/* Grouped Rendering */}
          {groupBy ? (
            Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
              <div key={groupKey} className="mb-6 w-full">
                {/* Group Header */}
                <div className="px-4 py-2 flex items-center gap-2 group cursor-pointer sticky top-9 z-9 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur border-b border-l-4 border-gray-200 dark:border-gray-800"
                  style={{ borderLeftColor: getGroupColor(groupKey) || 'transparent' }}>
                  <ChevronDown size={14} className="text-gray-400" />
                  <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                    {getGroupTitle(groupKey)}
                  </span>
                  <span className="text-xs text-gray-400 font-medium ml-1">
                    {groupTasks.length} items
                  </span>
                </div>

                {/* Tasks */}
                <div className="border-l-4 border-transparent w-full" style={{ borderLeftColor: (getGroupColor(groupKey) || '#e2e8f0') + '40' }}>
                  {groupTasks.map((task, index) => (
                    <TaskRow
                      key={`${groupKey}-${task._id}`}
                      task={task}
                      index={index}
                      users={users}
                      boardId={boardId}
                      statuses={statuses}
                      priorities={priorities}
                      isExpanded={expandedRows.has(task._id)}
                      toggleRow={toggleRow}
                      openTaskModal={openTaskModal}
                      updateTask={updateTask}
                      updateTaskStatus={updateTaskStatus}
                      tShirtSizes={tShirtSizes}
                      gridTemplate={GRID_TEMPLATE}
                      activeMenuTaskId={activeMenuTaskId}
                      onToggleMenu={setActiveMenuTaskId}
                      onDelete={handleDeleteRequest}
                    />
                  ))}

                  {/* Add Item to Group */}
                  <div className="grid border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-l-4 border-transparent w-full" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                    <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                    <div className="px-3 py-3 border-r border-gray-200 dark:border-gray-700">
                      {creatingGroup === groupKey ? (
                        <div className="flex items-center gap-2">
                          <input
                            ref={groupCreationInputRef}
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTaskTitle.trim()) {
                                const defaultProps = { projectId: boardId, status: 'todo', priority: 'medium', labels: [] };
                                if (groupBy === 'status') defaultProps.status = groupKey;
                                if (groupBy === 'priority') defaultProps.priority = groupKey;
                                if (groupBy === 'tShirtSize') defaultProps.tShirtSize = groupKey;
                                if (groupBy === 'labels' && groupKey !== 'no_label') defaultProps.labels = [groupKey];

                                createTask({
                                  ...defaultProps,
                                  title: newTaskTitle,
                                  startDate: new Date().toISOString()
                                });
                                setNewTaskTitle('');
                              } else if (e.key === 'Escape') {
                                setCreatingGroup(null);
                              }
                            }}
                            onBlur={() => {
                              if (newTaskTitle.trim()) {
                                const defaultProps = { projectId: boardId, status: 'todo', priority: 'medium', labels: [] };
                                if (groupBy === 'status') defaultProps.status = groupKey;
                                if (groupBy === 'priority') defaultProps.priority = groupKey;
                                if (groupBy === 'tShirtSize') defaultProps.tShirtSize = groupKey;
                                if (groupBy === 'labels' && groupKey !== 'no_label') defaultProps.labels = [groupKey];

                                createTask({
                                  ...defaultProps,
                                  title: newTaskTitle,
                                  startDate: new Date().toISOString()
                                });
                                setNewTaskTitle('');
                              }
                              setCreatingGroup(null);
                            }}
                            placeholder="Görev adı yaz ve Enter'a bas..."
                            className="w-full bg-white dark:bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setCreatingGroup(groupKey);
                            setNewTaskTitle('');
                          }}
                          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors w-full text-left ml-2"
                        >
                          <Plus size={14} />
                          <span className="text-xs">Bu gruba ekle</span>
                        </button>
                      )}
                    </div>
                    {/* Spacers matching grid columns */}
                    <div className="border-r border-gray-200 dark:border-gray-700"></div>
                    <div className="border-r border-gray-200 dark:border-gray-700"></div>
                    <div className="border-r border-gray-200 dark:border-gray-700"></div>
                    <div className="border-r border-gray-200 dark:border-gray-700"></div>
                    <div className="border-r border-gray-200 dark:border-gray-700"></div>
                    <div className="border-r border-gray-200 dark:border-gray-700"></div>
                    <div className="border-r border-gray-200 dark:border-gray-700"></div>
                    <div className="border-r border-gray-200 dark:border-gray-700"></div>
                    <div className=""></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Non-Grouped Rendering (Original) */
            <div className="border-l-4 border-transparent w-full">
              <div>
                {boardTasks.map((task, index) => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    index={index}
                    users={users}
                    boardId={boardId}
                    statuses={statuses}
                    priorities={priorities}
                    isExpanded={expandedRows.has(task._id)}
                    toggleRow={toggleRow}
                    openTaskModal={openTaskModal}
                    updateTask={updateTask}
                    updateTaskStatus={updateTaskStatus}
                    tShirtSizes={tShirtSizes}
                    gridTemplate={GRID_TEMPLATE}
                    activeMenuTaskId={activeMenuTaskId}
                    onToggleMenu={setActiveMenuTaskId}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>

              {/* New Task Row (Inline) */}
              <div className="grid border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-l-4 border-transparent w-full" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                <div className="px-3 border-r border-gray-200 dark:border-gray-700 flex items-center" style={{ minHeight: '54px' }}>
                  {isCreating ? (
                    <input
                      ref={creationInputRef}
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTaskTitle.trim()) {
                          createTask({
                            title: newTaskTitle,
                            status: 'todo',
                            priority: 'medium',
                            projectId: boardId,
                            startDate: new Date().toISOString()
                          });
                          setNewTaskTitle('');
                          // Keep focus
                        } else if (e.key === 'Escape') {
                          setIsCreating(false);
                        }
                      }}
                      onBlur={() => {
                        if (newTaskTitle.trim()) {
                          createTask({
                            title: newTaskTitle,
                            status: 'todo',
                            priority: 'medium',
                            projectId: boardId,
                            startDate: new Date().toISOString()
                          });
                          setNewTaskTitle('');
                        }
                        setIsCreating(false);
                      }}
                      placeholder="Görev adı yaz ve Enter'a bas..."
                      className="w-full bg-white dark:bg-gray-800 border border-indigo-500 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors w-full text-left"
                    >
                      <Plus size={14} />
                      <span className="text-xs">Yeni görev ekle</span>
                    </button>
                  )}
                </div>
                {/* Empty Placeholder Cells using Grid */}
                <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                <div className="border-r border-gray-200 dark:border-gray-700 py-3"></div>
                <div className="py-3"></div>
              </div>
            </div>
          )}

          {/* Padding at bottom */}
          <div className="h-10"></div>
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
