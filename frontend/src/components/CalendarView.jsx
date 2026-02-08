import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import ModernTaskModal from './ModernTaskModal';
import UserAvatar from './ui/shared/UserAvatar';
import { filterProjectUsers } from '../utils/userHelper';
import pkg from '../../package.json';

const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#c4c4c4', bg: 'rgba(196, 196, 196, 0.15)', text: '#666' },
  { id: 'working', label: 'Devam Ediyor', color: '#fdab3d', bg: 'rgba(253, 171, 61, 0.18)', text: '#b37200' },
  { id: 'stuck', label: 'Takıldı', color: '#e2445c', bg: 'rgba(226, 68, 92, 0.15)', text: '#a61b31' },
  { id: 'done', label: 'Tamamlandı', color: '#00c875', bg: 'rgba(0, 200, 117, 0.15)', text: '#007a48' },
  { id: 'review', label: 'İncelemede', color: '#579bfc', bg: 'rgba(87, 155, 252, 0.15)', text: '#1b5cbd' }
];

const CalendarView = ({ boardId, filters, searchQuery }) => {
  const { tasks, fetchTasks, users, projects } = useData();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch tasks when boardId changes
  useEffect(() => {
    if (boardId) {
      // Optimize: Only fetch if we don't have tasks for this board to prevent "refresh" flicker
      const hasTasks = tasks.some(t => t.projectId === Number(boardId));
      if (!hasTasks) {
        fetchTasks(boardId);
      }
    }
  }, [boardId, tasks, fetchTasks]);

  // Project-based user filtering
  const projectUsers = useMemo(() => {
    const project = projects.find(p => p.id === Number(boardId));
    return filterProjectUsers(project, users);
  }, [users, boardId, projects]);

  const boardTasks = useMemo(() => {
    let filtered = tasks.filter(t => t.projectId === Number(boardId));

    // For calendar, we need tasks that have at least one date
    filtered = filtered.filter(t => t.startDate || t.dueDate);

    // Apply Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(lowerQuery) ||
        projectUsers.find(u => task.assignees?.includes(u.id))?.fullName?.toLowerCase().includes(lowerQuery)
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
  }, [tasks, boardId, searchQuery, filters, projectUsers]);

  // Logic to determine which tasks sit on which 'row' to avoid overlaps
  const taskRows = useMemo(() => {
    const rows = [];
    const sortedTasks = [...boardTasks].sort((a, b) => {
      const startA = new Date(a.startDate || a.dueDate).getTime();
      const startB = new Date(b.startDate || b.dueDate).getTime();
      if (startA !== startB) return startA - startB;
      // If same start, longer tasks first
      const endA = new Date(a.dueDate || a.startDate).getTime();
      const endB = new Date(b.dueDate || b.startDate).getTime();
      return endB - endA;
    });

    sortedTasks.forEach(task => {
      const start = new Date(task.startDate || task.dueDate);
      const end = new Date(task.dueDate || task.startDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      let rowIndex = 0;
      while (true) {
        if (!rows[rowIndex]) rows[rowIndex] = [];

        const conflict = rows[rowIndex].some(existing => {
          const eStart = new Date(existing.startDate || existing.dueDate);
          const eEnd = new Date(existing.dueDate || existing.startDate);
          eStart.setHours(0, 0, 0, 0);
          eEnd.setHours(23, 59, 59, 999);
          return (start <= eEnd && end >= eStart);
        });

        if (!conflict) {
          rows[rowIndex].push(task);
          task.rowIndex = rowIndex; // Inject row index for easy lookup
          break;
        }
        rowIndex++;
      }
    });
    return rows;
  }, [boardTasks]);

  const getStatusConfig = (statusId) => {
    return statuses.find(s => s.id === statusId) || statuses[0];
  };

  // Calendar logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const getTasksForDate = (day) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    const dayTasks = [];
    taskRows.forEach((row, rowIndex) => {
      const task = row.find(t => {
        const start = new Date(t.startDate || t.dueDate);
        const end = new Date(t.dueDate || t.startDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return d <= end && endOfDay >= start;
      });
      if (task) {
        dayTasks.push({ ...task, rowIndex });
      } else {
        dayTasks.push({ isPlaceholder: true, rowIndex });
      }
    });
    return dayTasks;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex-1 overflow-auto bg-white dark:bg-[#0f172a] p-6 relative">
        {/* 🎯 VERSİYON */}
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-lg animate-fade-in">
          v{pkg.version}
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-gray-100 tracking-tight">
              {monthNames[month]} <span className="text-slate-400 font-light">{year}</span>
            </h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={previousMonth}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-300 shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-300 shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Bugün
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {statuses.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 px-2 py-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-medium text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center font-bold text-[10px] uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[120px] bg-gray-50 dark:bg-gray-900/50 border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayTasks = getTasksForDate(day);
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className="min-h-[160px] border-b border-r border-slate-100 dark:border-slate-800/60 last:border-r-0 pb-1 bg-white dark:bg-slate-900/5 transition-colors flex flex-col group/cell"
                >
                  <div className="p-3 flex justify-between items-start">
                    <span
                      className={`text-xs font-bold leading-none ${isToday
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover/cell:text-slate-600'
                        }`}
                    >
                      {String(day).padStart(2, '0')}
                    </span>
                    {isToday && <div className="w-1 h-1 rounded-full bg-indigo-600" />}
                  </div>

                  <div className="flex-1 px-0 space-y-[2px]">
                    {dayTasks.slice(0, 5).map((slot, i) => {
                      if (slot.isPlaceholder) {
                        return <div key={`empty-${i}`} className="h-6" />;
                      }

                      const task = slot;
                      const status = getStatusConfig(task.status);

                      const startDate = new Date(task.startDate || task.dueDate);
                      const endDate = new Date(task.dueDate || task.startDate);
                      startDate.setHours(0, 0, 0, 0);
                      endDate.setHours(23, 59, 59, 999);

                      const d = new Date(year, month, day);
                      d.setHours(0, 0, 0, 0);

                      const isActualStart = d.getTime() === startDate.getTime();
                      const isActualEnd = d.getTime() === endDate.getTime();
                      const isFirstDayOfMonth = day === 1;

                      // Determine if we should show the content (only at start or every Monday)
                      const isMonday = d.getDay() === 1;
                      const showContent = isActualStart || isMonday || isFirstDayOfMonth;

                      return (
                        <div
                          key={task.id}
                          onClick={() => openTaskModal(task)}
                          className={`h-6 flex items-center cursor-pointer transition-all relative overflow-visible
                              ${isActualStart ? 'ml-2 rounded-l-full' : ''}
                              ${isActualEnd ? 'mr-2 rounded-r-full' : ''}
                          `}
                          style={{
                            backgroundColor: status.bg,
                            borderLeft: isActualStart ? `3px solid ${status.color}` : 'none'
                          }}
                        >
                          {showContent && (
                            <div className="flex items-center gap-2 pl-2 w-full min-w-0 z-10">
                              <div className="flex -space-x-1 shrink-0">
                                {(task.assignees || []).slice(0, 1).map(uid => (
                                  <UserAvatar
                                    key={uid}
                                    userId={uid}
                                    usersList={projectUsers}
                                    size="xs"
                                    className="w-4 h-4 ring-1 ring-white dark:ring-slate-800"
                                  />
                                ))}
                              </div>
                              <span
                                className="text-[10px] font-bold truncate tracking-tight"
                                style={{ color: status.text }}
                              >
                                {task.title}
                              </span>
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && selectedTask && (
        <ModernTaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default CalendarView;
