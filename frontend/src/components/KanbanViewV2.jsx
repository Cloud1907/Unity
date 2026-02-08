import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, MoreHorizontal, User, Calendar, GitMerge, MessageSquare, Trash2, TrendingUp } from 'lucide-react';
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

// Monday.com renk paleti - TAM eşleşme
const STATUS_COLORS = {
  todo: { bg: '#c4c4c4', text: '#323338', label: 'Başlanmadı', lightBg: '#f0f0f0' },
  working: { bg: '#fdab3d', text: '#FFFFFF', label: 'Devam Ediyor', lightBg: '#fff4e6' },
  review: { bg: '#579bfc', text: '#FFFFFF', label: 'İncelemede', lightBg: '#e8f2ff' },
  done: { bg: '#00c875', text: '#FFFFFF', label: 'Tamamlandı', lightBg: '#e6f7ed' },
  stuck: { bg: '#e2445c', text: '#FFFFFF', label: 'Takıldı', lightBg: '#ffe6ea' }
};

// Konfeti efekti
const celebrateTask = () => {
  try {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      if (confetti) {
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }
    }, 250);
  } catch (error) {
    console.error('Confetti error:', error);
  }
};


// Inline Status Dropdown Component with Portal
const InlineStatusDropdown = ({ currentStatus, onStatusChange, taskId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = 180;
      const popoverHeight = 250;
      let top = rect.bottom + 4;
      let left = rect.left;
      if (top + popoverHeight > viewportHeight) top = Math.max(8, rect.top - popoverHeight - 8);
      if (left + popoverWidth > viewportWidth) left = Math.max(8, viewportWidth - popoverWidth - 12);
      setPosition({ top, left });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleStatusSelect = async (newStatus) => {
    const oldStatus = currentStatus;
    setIsOpen(false);

    if (newStatus === 'done' && oldStatus !== 'done') {
      celebrateTask();
    }

    await onStatusChange(taskId, newStatus);
  };

  const currentConfig = STATUS_COLORS[currentStatus] || STATUS_COLORS.todo;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="px-3 py-1 rounded-md text-xs font-bold transition-all hover:scale-105 hover:shadow-lg"
        style={{
          backgroundColor: currentConfig.bg,
          color: currentConfig.text,
          boxShadow: `0 2px 8px ${currentConfig.bg}40`
        }}
      >
        {currentConfig.label}
      </button>

      {isOpen && document.body && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 min-w-[180px] py-2 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 999999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-100">
            Durum Değiştir
          </div>
          {Object.entries(STATUS_COLORS).map(([status, config]) => (
            <button
              key={status}
              onClick={() => handleStatusSelect(status)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all group"
            >
              <div
                className="w-4 h-4 rounded-md transition-transform group-hover:scale-110"
                style={{ backgroundColor: config.bg }}
              />
              <span className="text-gray-900 dark:text-gray-100 flex-1 text-left">{config.label}</span>
              {currentStatus === status && (
                <span className="text-green-500 text-sm">✓</span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

// Priority badges
const PRIORITY_CONFIG = {
  urgent: { color: '#cc0000', label: 'Acil', icon: '⇈' },
  high: { color: '#ff9900', label: 'Yüksek', icon: '↑' },
  medium: { color: '#555555', label: 'Orta', icon: '−' },
  low: { color: '#808080', label: 'Düşük', icon: '↓' }
};

// Inline Priority Dropdown with Portal
const InlinePriorityDropdown = ({ currentPriority, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = 140;
      const popoverHeight = 200;
      let top = rect.bottom + 4;
      let left = rect.left;
      if (top + popoverHeight > viewportHeight) top = Math.max(8, rect.top - popoverHeight - 8);
      if (left + popoverWidth > viewportWidth) left = Math.max(8, viewportWidth - popoverWidth - 12);
      setPosition({ top, left });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentConfig = PRIORITY_CONFIG[currentPriority] || PRIORITY_CONFIG.medium;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="px-2 py-0.5 rounded text-xs font-bold transition-all hover:scale-105"
        style={{
          backgroundColor: `${currentConfig.color}15`,
          color: currentConfig.color,
          border: `1px solid ${currentConfig.color}30`
        }}
      >
        {currentConfig.icon} {currentConfig.label}
      </button>

      {isOpen && document.body && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 min-w-[140px] py-1 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 999999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              <span>{config.icon}</span>
              <span style={{ color: config.color }}>{config.label}</span>
              {currentPriority === key && <span className="ml-auto text-blue-600">✓</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

// Monday.com Style Calendar Picker
const InlineDatePickerSmall = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const buttonRef = useRef(null);
  const datePickerRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const popoverWidth = 280;
      const popoverHeight = 350;

      let top = rect.bottom + 4;
      let left = rect.left;

      if (top + popoverHeight > viewportHeight) {
        top = Math.max(8, rect.top - popoverHeight - 8);
      }
      if (left + popoverWidth > viewportWidth) {
        left = Math.max(8, viewportWidth - popoverWidth - 12);
      }

      setPosition({ top, left });

      if (value) {
        setCurrentMonth(new Date(value));
      }
    }
  }, [isOpen, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih ekle';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const isOverdue = value && new Date(value) < new Date();

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const handleDateClick = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onChange(toSkyISOString(selectedDate));
    setIsOpen(false);
  };

  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const isSelectedDate = (day) => {
    if (!value) return false;
    const selected = new Date(value);
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const dayNames = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all hover:bg-gray-100 dark:hover:bg-slate-800 ${isOverdue ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : value ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
          }`}
      >
        <Calendar size={11} />
        <span>{formatDate(value)}</span>
      </button>

      {isOpen && document.body && createPortal(
        <div
          ref={datePickerRef}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-4"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 999999,
            width: '280px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors text-gray-600 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">{monthName}</span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors text-gray-600 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, idx) => (
              <div key={idx} className="text-center text-xs font-semibold text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const selected = isSelectedDate(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg
                    transition-all hover:bg-blue-50 hover:text-blue-600
                    ${selected ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}
                    ${today && !selected ? 'border-2 border-blue-400 font-semibold' : ''}
                    ${!selected && !today ? 'text-gray-700' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                onChange(toSkyISOString(new Date()));
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
            >
              Bugün
            </button>
            {value && (
              <button
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Temizle
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// Kompakt Task Card - Monday.com stili - MEMOIZED
const CompactTaskCard = React.memo(({
  task,
  onDragStart,
  onDragEnd,
  isDragging,
  users,
  projectId,
  workspaceId,
  onStatusChange,
  onTaskClick,
  onUpdate,
  onDelete,
  activeMenuTaskId, // Prop to know if this card's menu should be open
  onToggleMenu, // Handler to toggle this card's menu
  autoFocus, // NEW: Prop to auto-focus the title
  currentUser // Passed from parent for permission checks
}) => {
  // Normalize assignees to IDs with robust matching
  const assigneeIds = (task.assignees || []).map(a => String(a.userId || a.id || a));

  const assignees = users.filter(u => assigneeIds.includes(String(u.id))); // Strict ID
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef(null);

  // Is THIS card's menu open?
  const showMenu = activeMenuTaskId === task.id;
  const getIds = (list, key = 'userId') => {
    if (!list) return [];
    return list.map(item => {
      // Simplification using strict ID if object, else assume ID
      if (typeof item === 'object' && item !== null) {
        return String(item[key] || item.id || item); // Prioritize key then ID
      }
      return String(item);
    });
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Sadece kart alanına tıklanırsa detay aç
        if (e.target.closest('button') || e.target.closest('[role="menu"]')) return;
        onTaskClick(task);
      }}
      className={`bg-white dark:bg-slate-800 rounded-xl p-3 border transition-all duration-300 cursor-pointer group relative ${isDragging
        ? 'opacity-80 scale-105 shadow-2xl rotate-2 z-50'
        : 'opacity-100 shadow-sm hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
        } ${autoFocus ? 'animate-in fade-in slide-in-from-top-2 duration-300' : ''}`}
      style={{
        transform: isDragging ? 'rotate(2deg)' : 'translateY(0)',
        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s'
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2 relative">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: STATUS_COLORS[task.status]?.bg || STATUS_COLORS.todo.bg }}
          />
          <InlineTextEdit
            value={task.title}
            onSave={(newTitle) => onUpdate(task.id, { title: newTitle })}
            startEditing={autoFocus}
            className="text-[13px] font-medium text-gray-800 dark:text-gray-200 leading-tight !p-0 hover:!bg-transparent truncate block"
            inputClassName="w-full bg-white dark:bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none overflow-hidden leading-normal min-h-[20px]"
          />
        </div>

        <button
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-opacity card-menu-trigger ${isHovered || showMenu ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={(e) => {
            e.stopPropagation();
            // Toggle logic: if already open, close (null). If closed, open (this task id)
            onToggleMenu(showMenu ? null : task.id);
          }}
        >
          <MoreHorizontal size={14} className="text-gray-400" />
        </button>

        {/* Portals for Menus */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 top-6 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {(currentUser?.role === 'admin' || task.createdBy === currentUser?.id || (!task.createdBy && task.assignedBy === currentUser?.id)) && (
              <button
                onClick={() => {
                  onToggleMenu(null); // Close menu
                  onDelete(task.id);
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 size={12} />
                Görevi Sil
              </button>
            )}
          </div>
        )}

      </div>

      {/* Priority & Date Row */}
      <div className="flex items-center gap-2 mb-2">
        {/* Priority */}
        <InlinePriorityDropdown
          currentPriority={task.priority}
          onChange={(newPriority) => onUpdate(task.id, { priority: newPriority })}
        />

        {/* Date */}
        <InlineDatePickerSmall
          value={task.dueDate}
          onChange={(newDate) => onUpdate(task.id, { dueDate: newDate })}
        />
      </div>

      {/* Task Indicators */}
      <div className="flex items-center gap-2 mb-2">
        {(task.subtaskCount > 0 || task.subtasksCount > 0 || task.subtasks?.length > 0) && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-[#6366f1] transition-colors cursor-pointer"
            title="Alt Görevler"
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, 'subtasks');
            }}
          >
            <GitMerge size={10} className="rotate-90 text-[#6366f1] dark:text-[#818cf8]" />
            <span className="text-[9px] font-bold">
              {task.subtasks?.length > 0
                ? `${task.subtasks.filter(s => s.isCompleted).length}/${task.subtasks.length}`
                : `${Math.round(((task.progress || 0) / 100) * (task.subtaskCount || task.subtasksCount || 0))}/${task.subtaskCount || task.subtasksCount || 0}`
              }
            </span>
          </div>
        )}

        {/* Attachments */}
        {(task.attachmentCount > 0 || task.attachmentsCount > 0 || task.attachments?.length > 0) && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-[#6366f1] transition-colors cursor-pointer"
            title={`${task.attachmentCount || task.attachmentsCount || task.attachments?.length} dosya`}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, 'files');
            }}
          >
            <TrendingUp size={10} className="rotate-90 text-[#6366f1]" />
            <span className="text-[9px] font-bold">{task.attachmentCount || task.attachmentsCount || task.attachments?.length || 0}</span>
          </div>
        )}

        {/* Comments */}
        {(task.commentCount > 0 || task.commentsCount > 0 || task.comments?.length > 0) && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-[#00c875] transition-colors cursor-pointer"
            title={`${task.commentCount || task.commentsCount || task.comments?.length} yorum`}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, 'comments');
            }}
          >
            <MessageSquare size={10} className="text-[#00c875]" />
            <span className="text-[9px] font-bold">{task.commentCount || task.commentsCount || task.comments?.length || 0}</span>
          </div>
        )}
      </div>

      {/* Labels Row */}
      <div className="mb-2">
        <InlineLabelPicker
          taskId={task.id}
          currentLabels={task.labels || task.labelIds || []}
          projectId={projectId}
          onUpdate={(taskId, newLabels) => onUpdate(taskId, { labels: newLabels })}
        />
      </div>

      {/* Bottom Section - Assignee */}
      <div className="flex items-center gap-2">
        <InlineAssigneePicker
          assigneeIds={assigneeIds}
          allUsers={users}
          workspaceId={workspaceId}
          onChange={(newAssignees) => {
            // Update using 'assignees' key to match TaskRow / Backend behavior
            onUpdate(task.id, { assignees: newAssignees });
          }}
        />
      </div>
      {/* Creator Info - Moved to Right of Assignees */}
      {!!task.createdBy && task.createdBy > 0 && (
        <div className="ml-auto flex items-center h-6">
          <p className="text-[9px] text-gray-400 dark:text-gray-500 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity whitespace-nowrap">
            <span className="font-light">Oluşturan:</span>
            <span className="font-normal text-gray-500 dark:text-gray-400">
              {users.find(u => u.id === task.createdBy)?.fullName || 'Bilinmeyen'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
});

const KanbanViewV2 = ({ boardId, searchQuery, filters }) => {
  const { tasks, users: allUsers, projects, loading, labels } = useDataState();
  const { fetchTasks, fetchLabels, updateTaskStatus, updateTask, deleteTask } = useDataActions();
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

    // Filter out 'done' tasks older than 7 days (User Request) - DISABLED
    /*
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    filtered = filtered.filter(t => {
      if (t.status === 'done') {
        const updateDate = t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt || Date.now());
        return updateDate > sevenDaysAgo;
      }
      return true;
    });
    */

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
  };

  const handleAddTask = async (columnId) => {
    // Instant add - create task directly without modal
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

    try {
      // Use tasksAPI to create task - automatically handles Auth and URL
      const response = await tasksAPI.create(newTask);

      const createdTask = response.data; // axios response structure

      await fetchTasks(boardId);
      // Set the new task ID to trigger auto-focus
      setJustCreatedTaskId(createdTask.id);

      // Clear the focus target after a delay to prevent re-focusing on re-renders
      setTimeout(() => setJustCreatedTaskId(null), 2000);

    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Görev oluşturulamadı'); // Added toast for better UX
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
                          layoutId={task.id} // Enable shared element transition between columns
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

                  {/* Empty State */}
                  {columnTasks.length === 0 && !isDropTarget && (
                    <div className="text-center py-20 px-4 opacity-50 bg-dashed border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl mt-2">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <Plus size={24} className="text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium capitalize tracking-wide">Görev Ekle</p>
                    </div>
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
