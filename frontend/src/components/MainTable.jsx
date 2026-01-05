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
import pkg from '../../package.json';

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

const MainTable = ({ boardId, searchQuery, filters }) => {
  const { tasks, users, projects, labels } = useDataState();
  const { fetchTasks, fetchLabels, updateTaskStatus, updateTask, deleteProject, createTask } = useDataActions();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialSection, setModalInitialSection] = useState('activity');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Inline Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const creationInputRef = useRef(null);

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Optimize data fetching: Only fetch if needed
  React.useEffect(() => {
    if (boardId) {
      // Fetch tasks if needed
      const hasTasks = tasks.some(t => t.projectId === boardId);
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
    let filtered = tasks.filter(t => t.projectId === boardId);

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

  // Show empty state if no board selected
  if (!boardId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#0f172a]">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">Bir proje seçin veya yeni proje oluşturun</p>
        </div>
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
      <div className="flex-1 overflow-auto bg-white dark:bg-[#0f172a] relative">
        {/* 🎯 VERSİYON */}
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-lg animate-fade-in">
          v{pkg.version} 👤
        </div>

        <div className="min-w-max">
          {/* Table Header */}
          <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
            <div className="flex">
              <div className="w-10 flex items-center justify-center py-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                <input type="checkbox" className="rounded w-3 h-3" />
              </div>
              <div className="w-8 flex items-center justify-center py-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                {/* Expander Column Header */}
              </div>
              <div className="w-72 px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                Görev
              </div>
              <div className="w-40 px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                Durum
              </div>
              <div className="w-32 px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                Öncelik
              </div>
              <div className="w-40 px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                Atanan
              </div>
              <div className="w-28 px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                Son Tarih
              </div>
              <div className="w-40 px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                Etiketler
              </div>
              <div className="w-28 px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                İlerleme
              </div>
              <div className="w-20 px-3 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur">
                Dosyalar
              </div>
            </div>
          </div>

          {/* Table Body */}
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
                expandedRows={expandedRows}
                toggleRow={toggleRow}
                openTaskModal={openTaskModal}
                updateTask={updateTask}
                updateTaskStatus={updateTaskStatus}
              />
            ))}
          </div>

          {/* New Task Row (Inline) */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-10 border-r border-gray-100 dark:border-gray-800 py-3"></div>
            <div className="w-8 border-r border-gray-100 dark:border-gray-800 py-3"></div>
            <div className="w-72 px-3 py-3 border-r border-gray-100 dark:border-gray-800">
              {isCreating ? (
                <div className="flex items-center gap-2">
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
                    className="w-full bg-white border border-indigo-500 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors w-full text-left"
                >
                  <Plus size={14} />
                  <span className="text-xs">Yeni görev ekle</span>
                </button>
              )}
            </div>
            {/* Empty Placeholder Cells for Alignment */}
            <div className="w-40 border-r border-gray-100 dark:border-gray-800 py-3"></div>
            <div className="w-32 border-r border-gray-100 dark:border-gray-800 py-3"></div>
            <div className="w-40 border-r border-gray-100 dark:border-gray-800 py-3"></div>
            <div className="w-28 border-r border-gray-100 dark:border-gray-800 py-3"></div>
            <div className="w-40 border-r border-gray-100 dark:border-gray-800 py-3"></div>
            <div className="w-28 border-r border-gray-100 dark:border-gray-800 py-3"></div>
            <div className="w-20 py-3"></div>
          </div>

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
    </>
  );
};

export default MainTable;
