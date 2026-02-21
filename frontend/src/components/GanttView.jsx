import React, { useState, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useData } from '../contexts/DataContext';
import ModernTaskModal from './ModernTaskModal';
import { User, Calendar, Layers, ChevronDown, ChevronRight, Download, MessageSquare, Paperclip, ChevronLeft, Loader2 } from 'lucide-react';
import { reportsAPI } from '../services/api';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import UserAvatar from './ui/shared/UserAvatar';
import StatusBadge from './ui/shared/StatusBadge';
import { getAvatarUrl, getInitials, getUserColor } from '../utils/avatarHelper';
import { format, addDays, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import InlineAssigneePicker from './InlineAssigneePicker';
import InlineTextEdit from './InlineTextEdit';
import { useAuth } from '../contexts/AuthContext';
import { filterProjectUsers } from '../utils/userHelper';

// Local definition to prevent ReferenceError if import fails during HMR
const STATUS_CONFIG = {
  todo: { border: 'border-slate-200 dark:border-slate-700' },
  working: { border: 'border-blue-200 dark:border-blue-800' },
  review: { border: 'border-indigo-200 dark:border-indigo-800' },
  done: { border: 'border-emerald-200 dark:border-emerald-800' },
  stuck: { border: 'border-red-200 dark:border-red-800' },
  completed: { border: 'border-emerald-200 dark:border-emerald-800' },
  in_progress: { border: 'border-blue-200 dark:border-blue-800' }
};

// Status color mapping based on the high-fidelity design requirements
const getTaskStyles = (type, isCompleted) => {
  if (type === 'parent') {
    return {
      bar: 'bg-slate-200 dark:bg-slate-700',
      progress: 'bg-slate-500/80 dark:bg-slate-400',
      text: 'text-white'
    };
  }

  // Logic delegated to Shared StatusComponent for labels/text
  // But for timeline BARS we keep local styles for now or map them later
  if (isCompleted) {
    return {
      bar: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-500',
      text: 'text-green-700 dark:text-green-400',
      label: 'Tamamlandı'
    };
  }

  return {
    bar: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Devam Ediyor'
  };
};

const GANTT_ROW_HEIGHT = 42;
const GANTT_HEADER_HEIGHT = 45;
const DAY_WIDTH = 48; // Synchronized with timeline header

const GanttView = ({ boardId, filters, searchQuery, groupBy: headerGroupBy }) => {
  const { tasks, fetchTasks, users, projects, updateTask } = useData();
  const { user: currentUser } = useAuth();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupBy, setGroupBy] = useState('none');
  const [expandedTasks, setExpandedTasks] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const ganttRef = useRef(null);

  // Date range: default -5 days to +60 days from today
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 5);
    const end = new Date(today);
    end.setDate(today.getDate() + 60);
    return { start, end };
  });

  // Project-based user filtering
  const projectUsers = React.useMemo(() => {
    const project = projects.find(p => p.id === Number(boardId));
    return filterProjectUsers(project, users);
  }, [users, boardId, projects]);

  const toggleSubtasks = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleDatePrev = () => {
    setDateRange(prev => ({
      start: subDays(prev.start, 7),
      end: subDays(prev.end, 7)
    }));
  };

  const handleDateNext = () => {
    setDateRange(prev => ({
      start: addDays(prev.start, 7),
      end: addDays(prev.end, 7)
    }));
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    const newStart = new Date(date);
    // Keep 60 day window or current window size
    const currentDiff = dateRange.end.getTime() - dateRange.start.getTime();
    const newEnd = new Date(newStart.getTime() + currentDiff);
    setDateRange({ start: newStart, end: newEnd });
  };

  // Sync groupBy from Header
  useEffect(() => {
    if (headerGroupBy) {
      setGroupBy(headerGroupBy);
    } else {
      setGroupBy('none');
    }
  }, [headerGroupBy]);

  const getIds = (list, key = 'userId') => {
    if (!list) return [];
    return list.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item[key] || item.id || item.labelId || item;
      }
      return item;
    });
  };

  // Per-component fetch removed to avoid infinite loops on empty boards.
  // DataContext handles global fetch.
  /*
  React.useEffect(() => {
    if (boardId) {
      // Optimize: Prevent flash/refresh loop if tasks exist
      const hasTasks = tasks.some(t => t.projectId === Number(boardId));
      if (!hasTasks) {
        fetchTasks(boardId);
      }
    }
  }, [boardId, tasks, fetchTasks]);
  */

  const boardTasks = useMemo(() => {
    let filtered = tasks.filter(t => t.projectId === Number(boardId));

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
  }, [tasks, boardId, searchQuery, filters, projectUsers]);

  // Auto-expand tasks with subtasks on load or data change
  React.useEffect(() => {
    if (boardTasks.length > 0) {
      setExpandedTasks(prev => {
        const next = { ...prev };
        let hasChanges = false;
        boardTasks.forEach(task => {
          if (task.subtasks && task.subtasks.length > 0 && next[task.id] === undefined) {
            next[task.id] = true;
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [boardTasks]);

  const timeline = useMemo(() => {
    const dates = [];
    let current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [dateRange]);

  const getDayPosition = (dateStr) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);
    return Math.floor((date - start) / (1000 * 60 * 60 * 24));
  };

  const getTaskDuration = (startStr, endStr) => {
    if (!startStr || !endStr) return 1;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };

  const getUser = (assignee) => {
    if (!assignee) return undefined;
    const id = typeof assignee === 'object' ? (assignee.userId || assignee.id) : assignee;
    return projectUsers.find(u => u.id === id);
  };
  const getUserName = (userId) => getUser(userId)?.fullName || 'Atanmamış';
  const getUserAvatar = (userId) => getUser(userId)?.avatar;
  const getUserObject = (userId) => getUser(userId) || { fullName: 'Atanmamış', username: 'Unassigned' };

  const groupedTasks = useMemo(() => {
    if (groupBy === 'assignee') {
      const groups = {};
      boardTasks.forEach(task => {
        const primaryAssignee = task.assignees && task.assignees.length > 0 ? task.assignees[0] : null;
        const user = getUser(primaryAssignee);
        const userId = user ? user.id : 'unassigned';
        const groupName = user ? user.fullName : 'Atanmamış';
        if (!groups[userId]) groups[userId] = { id: userId, name: groupName, tasks: [], avatar: user?.avatar, color: user?.color };
        groups[userId].tasks.push(task);
      });
      return Object.values(groups);
    }
    return [{ id: 'all', name: 'Tüm Görevler', tasks: boardTasks }];
  }, [boardTasks, groupBy, users]);

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    toast.loading('PDF hazırlanıyor...');

    try {
      const originalElement = ganttRef.current;
      if (!originalElement) throw new Error('Gantt container not found');

      // 1. Calculate Total Dimensions
      // We need the full scroll width of the timeline + sidebar + any padding
      const scrollContainer = originalElement.querySelector('.overflow-auto');
      const totalWidth = scrollContainer ? scrollContainer.scrollWidth : originalElement.scrollWidth;
      const totalHeight = scrollContainer ? scrollContainer.scrollHeight + 150 : originalElement.scrollHeight + 150; // +150 for header/legend

      // 2. Clone the node
      const clone = originalElement.cloneNode(true);

      // 3. Create a wrapper for capture
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.top = '-9999px';
      wrapper.style.left = '-9999px';
      wrapper.style.width = `${totalWidth}px`;
      wrapper.style.height = `${totalHeight}px`;
      wrapper.style.backgroundColor = '#ffffff'; // Ensure white background
      wrapper.style.zIndex = '-1';
      document.body.appendChild(wrapper);

      // 4. Add Professional Header
      const header = document.createElement('div');
      header.style.padding = '20px 40px';
      header.style.borderBottom = '1px solid #e2e8f0';
      header.style.marginBottom = '20px';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.innerHTML = `
        <div>
          <h1 style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 0;">${projects.find(p => p.id === Number(boardId))?.name || 'Proje'} - Zaman Çizelgesi</h1>
          <p style="font-size: 14px; color: #64748b; margin: 5px 0 0;">Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">UNITASK PROJECT MANAGEMENT</span>
        </div>
      `;
      wrapper.appendChild(header);

      // 5. Append Clone and Force Full Size
      wrapper.appendChild(clone);

      // Apply styles to ensure clone expands fully
      clone.style.width = '100%';
      clone.style.height = 'auto'; // Let content define height
      clone.style.overflow = 'visible';
      clone.style.maxHeight = 'none';

      // Find internal scroll containers and expand them
      const cloneScrollContainer = clone.querySelector('.overflow-auto');
      if (cloneScrollContainer) {
        cloneScrollContainer.style.overflow = 'visible';
        cloneScrollContainer.style.width = '100%';
        cloneScrollContainer.style.height = 'auto';
        cloneScrollContainer.className = cloneScrollContainer.className.replace('overflow-auto', '');
      }

      // Hide interactive elements in clone (optional)
      const controls = clone.querySelector('.h-14'); // Top nav bar selector
      if (controls) controls.style.display = 'none'; // Hide top controls

      // 6. Capture
      const canvas = await html2canvas(wrapper, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: totalWidth,
        height: totalHeight,
        windowWidth: totalWidth,
        windowHeight: totalHeight
      });

      // 7. Generate PDF (Single Page)
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width / 2; // Adjust for scale: 2 (canvas pixels -> PDF points)
      const imgHeight = canvas.height / 2;

      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight], // Exact dimensions
        hotfixes: ['px_scaling']
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const projectName = projects.find(p => p.id === Number(boardId))?.name || 'Proje';
      const dateStr = format(new Date(), 'yyyyMMdd_HHmm');
      pdf.save(`${projectName}_Zaman_Cizelgesi_${dateStr}.pdf`);

      // 8. Cleanup
      document.body.removeChild(wrapper);
      toast.dismiss();
      toast.success('PDF başarıyla indirildi.');

    } catch (error) {
      console.error('PDF export error:', error);
      toast.dismiss();
      toast.error('PDF oluşturulurken hata: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <style>{`
        .gantt-grid {
          background-size: ${DAY_WIDTH}px 100%;
          background-image: linear-gradient(to right, #e5e7eb 1px, transparent 1px);
        }
        .dark .gantt-grid {
          background-image: linear-gradient(to right, #374151 1px, transparent 1px);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; }
      `}</style>

      <div className="h-full flex flex-col bg-white dark:bg-slate-950 select-none overflow-hidden" ref={ganttRef}>
        {/* Top Navigation / Actions */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shrink-0 z-50 relative">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-normal text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="text-primary w-5 h-5" />
              Zaman Çizelgesi
            </h2>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

            {/* Date Navigation Controls */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button onClick={handleDatePrev} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 transition-all hover:text-primary">
                <ChevronLeft size={16} />
              </button>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="px-3 py-1 text-xs font-normal text-slate-700 dark:text-slate-200 hover:text-primary transition-colors min-w-[140px] text-center">
                    {format(dateRange.start, 'd MMMM yyyy', { locale: tr })}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.start}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={tr}
                  />
                </PopoverContent>
              </Popover>

              <button onClick={handleDateNext} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 transition-all hover:text-primary">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-xs font-normal tracking-wide focus:ring-2 focus:ring-primary cursor-pointer text-slate-500"
            >
              <option value="none">Grup Yok</option>
              <option value="assignee">Sorumlu</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-normal tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-50 h-8"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={1.5} />}
              <span>{isExporting ? 'Hazırlanıyor...' : 'Proje Planı İndir'}</span>
            </button>
          </div>
        </div>

        {/* Unified Scroll Container (Sync Scrolling) */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <div className="min-w-max">

            {/* Sticky Timeline Header */}
            <div className="sticky top-0 z-50 hover:z-50 flex h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              {/* Fixed Corner */}
              <div className="sticky left-0 w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-50 flex items-center px-4">
                <span className="text-[10px] font-normal text-slate-400 tracking-[0.2em]">Görevler ve Aşamalar</span>
              </div>
              {/* Scrollable Days */}
              <div className="flex">
                {timeline.map((date, index) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "w-12 shrink-0 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center bg-white dark:bg-slate-900",
                        isWeekend && "bg-slate-50/50 dark:bg-slate-800/50",
                        isToday && "bg-primary/5 border-primary/20"
                      )}
                    >
                      <span className={cn("text-[9px] font-normal tracking-tighter", isToday ? "text-primary" : "text-slate-400")}>
                        {date.toLocaleDateString('tr-TR', { weekday: 'short' }).toUpperCase()}
                      </span>
                      <span className={cn("text-[11px] font-normal", isToday ? "text-primary" : "text-slate-600 dark:text-slate-300")}>
                        {date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gantt Body Content */}
            <div className="relative">
              {/* Full Height Grid Background (Absolute) */}
              <div className="absolute inset-0 left-80 pointer-events-none gantt-grid z-0"></div>

              {/* Today Line Overlay */}
              <div
                className="absolute top-0 bottom-0 border-l-[1.5px] border-red-400 z-30 pointer-events-none transition-all"
                style={{ left: `${320 + getDayPosition(new Date()) * DAY_WIDTH + DAY_WIDTH / 2}px` }}
              >
              </div>

              {/* Task Rows */}
              {groupedTasks.map((group) => (
                <div key={group.id} className="flex flex-col">
                  {groupBy !== 'none' && (
                    <div className="sticky left-0 right-0 z-20 flex">
                      <div className="sticky left-0 w-80 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-y border-slate-100 dark:border-slate-800 text-[11px] font-normal text-slate-500 dark:text-slate-300 tracking-wider flex items-center gap-2">
                        {group.avatar ? (
                          <UserAvatar user={{ avatar: group.avatar, fullName: group.name, color: group.color }} size="sm" />
                        ) : null}
                        {group.name.toUpperCase()}
                      </div>
                      <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/30 border-y border-slate-100 dark:border-slate-800"></div>
                    </div>
                  )}

                  {group.tasks.map((task) => {
                    const startProp = task.startDate || task.createdAt;
                    const startPosition = getDayPosition(startProp);
                    const duration = getTaskDuration(startProp, task.dueDate);

                    // Resolve status key for styling
                    let statusKey = 'todo';
                    if (task.completed) statusKey = 'done';
                    else if (task.status) {
                      const s = task.status.toLowerCase();
                      if (s === 'done' || s === 'completed') statusKey = 'done';
                      else if (s === 'in progress' || s === 'working') statusKey = 'working';
                      else if (s === 'stuck') statusKey = 'stuck';
                      else if (s === 'review') statusKey = 'review';
                    }

                    const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.todo;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex flex-col relative mt-2 pt-2 border-t-[2px] first:mt-0 first:pt-0 first:border-t-0 transition-colors border-slate-200 dark:border-slate-800"
                        )}
                      >
                        {/* Subtle Light Reflection (Top Shine) */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none z-10"></div>
                        {/* Parent Task Row */}
                        <div className="flex items-center h-[36px] group hover:bg-slate-50/30 dark:hover:bg-slate-800/20 active:bg-slate-100/50 transition-colors">
                          <div className="sticky left-0 w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 flex items-center px-4 h-full group/sidebar">
                            <button
                              onClick={() => toggleSubtasks(task.id)}
                              className="w-5 h-5 flex items-center justify-center mr-1 text-slate-400 hover:text-primary transition-colors"
                            >
                              {expandedTasks[task.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            <div className="flex-1 min-w-0 mr-2">
                              <InlineTextEdit
                                value={task.title}
                                onSave={(newTitle) => updateTask(task.id, { title: newTitle })}
                                className="text-[13px] font-normal text-slate-800 dark:text-slate-100 tracking-tight !truncate overflow-hidden !whitespace-nowrap cursor-pointer hover:text-primary block w-full text-left"
                              />
                            </div>

                            {/* Interactive Assignee Picker */}
                            <div className="shrink-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
                              <InlineAssigneePicker
                                assigneeIds={getIds(task.assignees, 'userId')}
                                allUsers={projectUsers}
                                onChange={(newAssignees) => updateTask(task.id, { assigneeIds: newAssignees })}
                              />
                            </div>
                          </div>

                          {/* Timeline Bar Cell */}
                          <div className="relative flex-1 h-full">
                            {startPosition >= -10 && startPosition <= timeline.length + 10 && (
                              <div
                                onClick={() => openTaskModal(task)}
                                className={cn(
                                  "absolute top-1/2 -translate-y-1/2 h-5 rounded-md cursor-pointer border overflow-hidden z-10 transition-all hover:shadow-md",
                                  getTaskStyles('parent').bar,
                                  "border-slate-300 dark:border-slate-600"
                                )}
                                style={{
                                  left: `${startPosition * DAY_WIDTH + 4}px`,
                                  width: `${duration * DAY_WIDTH - 8}px`,
                                }}
                              >
                                <div
                                  className={cn("h-full flex items-center px-3 transition-all opacity-90 relative overflow-visible", getTaskStyles('parent').progress)}
                                  style={{ width: `${task.progress || 0}%` }}
                                >
                                  <span className="text-[10px] text-white font-normal truncate tracking-tight z-10 relative">
                                    {task.title} {task.progress > 0 ? `(${task.progress}%)` : ''}
                                  </span>
                                </div>

                                {/* Floating Avatars at end of bar */}
                                {task.assignees && task.assignees.length > 0 && (
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 flex -space-x-2 z-20 transition-all hover:scale-110 hover:z-30"
                                    style={{ left: `calc(100% + 8px)` }}
                                  >
                                    {getIds(task.assignees).slice(0, 3).map((assigneeId, idx) => (
                                      <UserAvatar
                                        key={idx}
                                        userId={assigneeId}
                                        usersList={users}
                                        size="xs"
                                        className="w-5 h-5 border-white ring-1 ring-white/50 shadow-sm"
                                      />
                                    ))}
                                    {getIds(task.assignees).length > 3 && (
                                      <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold text-slate-600 shadow-sm">
                                        +{getIds(task.assignees).length - 3}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Subtasks */}
                        {expandedTasks[task.id] && task.subtasks && task.subtasks.map((subtask, innerIndex) => {
                          const subStart = subtask.startDate || subtask.createdAt;
                          const subEnd = subtask.dueDate || subStart;
                          const subStartPosition = getDayPosition(subStart);
                          const subDuration = getTaskDuration(subStart, subEnd);
                          const styles = getTaskStyles('subtask', subtask.isCompleted);
                          const isLastSub = innerIndex === task.subtasks.length - 1;

                          return (
                            <div key={subtask.id} className="flex items-center h-[32px] group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800/30">
                              {/* Sticky Sidebar Cell (L-Shape) */}
                              <div className="sticky left-0 w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 flex items-center h-full relative">
                                {/* L-Shape Connector */}
                                <div className="absolute left-[26px] top-[-18px] bottom-1/2 w-[22px] border-l-[2px] border-b-[2px] border-slate-200 dark:border-slate-700 rounded-bl-xl pointer-events-none"></div>
                                {!isLastSub && (
                                  <div className="absolute left-[26px] top-0 bottom-0 w-px border-l-[2px] border-slate-200 dark:border-slate-700 pointer-events-none"></div>
                                )}

                                <div className="pl-[54px] flex items-center gap-3 w-full pr-4 relative z-10">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full shrink-0 transition-all",
                                    subtask.isCompleted ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "bg-slate-300 dark:bg-slate-600"
                                  )}></div>
                                  <div className="flex flex-col min-w-0">
                                    <span className={cn(
                                      "text-[11px] truncate tracking-tight transition-colors font-normal leading-none mb-0.5",
                                      subtask.isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                                    )}>
                                      {subtask.title}
                                    </span>
                                  </div>

                                  {subtask.assignees && subtask.assignees.length > 0 && (
                                    <div className="ml-auto flex -space-x-1.5 shrink-0 pl-2 opacity-100 group-hover:opacity-100 transition-opacity">
                                      {subtask.assignees.map((assigneeId, idx) => (
                                        <UserAvatar
                                          key={idx}
                                          userId={assigneeId}
                                          usersList={users}
                                          size="sm"
                                          className="relative z-10"
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Timeline Bar Cell */}
                              <div className="relative flex-1 h-full">
                                {subStartPosition >= -10 && subStartPosition <= timeline.length + 10 && (
                                  <div
                                    className={cn(
                                      "absolute top-1/2 -translate-y-1/2 h-4 rounded-md z-10 border flex items-center px-3 transition-all hover:scale-[1.01]",
                                      styles.bar,
                                      styles.border
                                    )}
                                    style={{
                                      left: `${subStartPosition * DAY_WIDTH + 8}px`,
                                      width: `${subDuration * DAY_WIDTH - 16}px`,
                                    }}
                                  >
                                    {/* Using StatusBadge logic implicitly via Text but we can make it cleaner later */}
                                    <span className={cn("text-[9px] font-normal truncate tracking-tighter", styles.text)}>
                                      {subtask.isCompleted ? 'Tamamlandı' : 'Devam Ediyor'}
                                    </span>

                                    {/* Floating Avatars for Subtasks */}
                                    {subtask.assignees && subtask.assignees.length > 0 && (
                                      <div
                                        className="absolute top-1/2 -translate-y-1/2 flex -space-x-2 z-20 transition-all hover:scale-110 hover:z-30"
                                        style={{ left: `calc(100% + 8px)` }}
                                      >
                                        {subtask.assignees.slice(0, 3).map((assigneeId, idx) => (
                                          <UserAvatar
                                            key={idx}
                                            userId={assigneeId}
                                            usersList={users}
                                            size="xs"
                                            className="w-5 h-5 border-white ring-1 ring-white/50 shadow-sm"
                                          />
                                        ))}
                                        {subtask.assignees.length > 3 && (
                                          <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold text-slate-600 shadow-sm">
                                            +{subtask.assignees.length - 3}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}

              {boardTasks.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs italic">Hiç görev bulunamadı.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <footer className="h-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-50 relative">
          <div className="flex items-center space-x-6">
            {[
              { label: 'Tamamlandı', color: 'bg-emerald-500/60' },
              { label: 'Devam Ediyor', color: 'bg-blue-500/60' },
              { label: 'Faz/Ana Görev', color: 'bg-slate-400' }
            ].map(item => (
              <div key={item.label} className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 font-normal tracking-wide">

                <div className={cn("w-3 h-3 rounded-sm mr-2", item.color)}></div>
                {item.label}
              </div>
            ))}
          </div>
          <div className="text-[10px] font-black text-slate-400 flex items-center uppercase tracking-widest">
            <Download size={12} className="mr-2" />
            Gantt Export Mode
          </div>
        </footer>
      </div >


      {isModalOpen && selectedTask && (
        <ModernTaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )
      }
    </>
  );
};

export default GanttView;
