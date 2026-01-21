import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, MoreHorizontal, User, Calendar, GitMerge, MessageSquare, Trash2, TrendingUp } from 'lucide-react';
import { useDataState, useDataActions } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ModernTaskModal from './ModernTaskModal';
import NewTaskModal from './NewTaskModal';
import InlineLabelPicker from './InlineLabelPicker';
import InlineTextEdit from './InlineTextEdit';
import ConfirmModal from './ui/ConfirmModal';
import confetti from 'canvas-confetti';

import { KanbanSkeleton } from './skeletons/KanbanSkeleton';
import EmptyState from './ui/EmptyState';

// Monday.com renk paleti - TAM eşleşme
const STATUS_COLORS = {
  todo: { bg: '#c4c4c4', text: '#323338', label: 'Yapılacak', lightBg: '#f0f0f0' },
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
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
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

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 min-w-[180px] py-2"
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
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
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

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 min-w-[140px] py-1"
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
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
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
    onChange(selectedDate.toISOString());
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

      {isOpen && createPortal(
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
                onChange(new Date().toISOString());
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
  onStatusChange,
  onTaskClick,
  onUpdate,
  onDelete,
  activeMenuTaskId, // Prop to know if this card's menu should be open
  onToggleMenu, // Handler to toggle this card's menu
  autoFocus // NEW: Prop to auto-focus the title
}) => {
  const assignees = users.filter(u => task.assignees?.includes(u.id || u._id));
  const [isHovered, setIsHovered] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [assigneeMenuPosition, setAssigneeMenuPosition] = useState({ top: 0, left: 0 });
  // Removed local showMenu state, using props instead

  const assigneeButtonRef = useRef(null);
  const assigneeMenuRef = useRef(null);
  const menuRef = useRef(null);

  // Is THIS card's menu open?
  const showMenu = activeMenuTaskId === task._id;

  // Position assignee menu
  useEffect(() => {
    if (showAssigneeMenu && assigneeButtonRef.current) {
      const rect = assigneeButtonRef.current.getBoundingClientRect();
      setAssigneeMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
    }
  }, [showAssigneeMenu]);

  // Close menus on outside click - Only for ASSIGNEE menu locally.
  // Main menu is handled by parent, but we can also have a loose click handler if needed,
  // usually lifting state means parent handles "close on outside", OR efficient local handling.
  // Ideally, if I click outside, 'onToggleMenu(null)' should be called.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(event.target) &&
        assigneeButtonRef.current && !assigneeButtonRef.current.contains(event.target)) {
        setShowAssigneeMenu(false);
      }
      // If menu is open and click is outside menu AND not on trigger
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('.card-menu-trigger')) {
        onToggleMenu(null); // Close menu
      }
    };
    if (showAssigneeMenu || showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAssigneeMenu, showMenu, onToggleMenu]);

  const toggleAssignee = (userId) => {
    const currentAssignees = task.assignees || [];
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];
    onUpdate(task._id, { assignees: newAssignees });
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
      className={`bg-white dark:bg-slate-800 rounded-xl p-3 border transition-all duration-300 cursor-pointer group ${isDragging
        ? 'opacity-80 scale-105 shadow-2xl rotate-2 z-50'
        : 'opacity-100 shadow-sm hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
        } ${autoFocus ? 'animate-in fade-in slide-in-from-top-2 duration-300' : ''}`}
      style={{
        transform: isDragging ? 'rotate(2deg)' : 'translateY(0)',
        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s'
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2 relative">
        <div className="flex-1 min-w-0">
          <InlineTextEdit
            value={task.title}
            onSave={(newTitle) => onUpdate(task._id, { title: newTitle })}
            startEditing={autoFocus}
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight !p-0 hover:!bg-transparent truncate block"
            inputClassName="w-full bg-white dark:bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none overflow-hidden leading-normal min-h-[24px]"
          />
        </div>

        <button
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-opacity card-menu-trigger ${isHovered || showMenu ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={(e) => {
            e.stopPropagation();
            // Toggle logic: if already open, close (null). If closed, open (this task id)
            onToggleMenu(showMenu ? null : task._id);
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
            <button
              onClick={() => {
                onToggleMenu(null); // Close menu
                onDelete(task._id);
              }}
              className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 size={12} />
              Görevi Sil
            </button>
          </div>
        )}

        {showAssigneeMenu && createPortal(
          <div
            ref={assigneeMenuRef}
            role="menu"
            className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 min-w-[200px] py-2"
            style={{
              position: 'fixed',
              top: `${assigneeMenuPosition.top}px`,
              left: `${assigneeMenuPosition.left}px`,
              zIndex: 999999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-100">
              Kişi Ata
            </div>
            <div className="max-h-48 overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id || user._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAssignee(user.id || user._id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-[10px]">
                      {user.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left text-gray-900 dark:text-gray-200">{user.fullName}</span>
                  {(task.assignees || []).includes(user.id || user._id) && (
                    <span className="text-blue-600 text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Priority & Date Row */}
      <div className="flex items-center gap-2 mb-2">
        {/* Priority */}
        <InlinePriorityDropdown
          currentPriority={task.priority}
          onChange={(newPriority) => onUpdate(task._id, { priority: newPriority })}
        />

        {/* Date */}
        <InlineDatePickerSmall
          value={task.dueDate}
          onChange={(newDate) => onUpdate(task._id, { dueDate: newDate })}
        />
      </div>

      {/* Task Indicators */}
      <div className="flex items-center gap-2 mb-2">
        {task.subtasks?.length > 0 && (
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
              {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
            </span>
          </div>
        )}

        {/* Attachments */}
        {(() => {
          const attachmentsJson = task.attachmentsJson || '[]';
          const attachmentsCount = (typeof attachmentsJson === 'string' ? JSON.parse(attachmentsJson).length : task.attachments?.length) || 0;
          if (attachmentsCount > 0) return (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-[#6366f1] transition-colors cursor-pointer"
              title={`${attachmentsCount} dosya`}
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick(task, 'files');
              }}
            >
              <TrendingUp size={10} className="rotate-90 text-[#6366f1]" />
              <span className="text-[9px] font-bold">{attachmentsCount}</span>
            </div>
          );
        })()}
        {(() => {
          const commentsJson = task.commentsJson || '[]';
          const commentsCount = (typeof commentsJson === 'string' ? JSON.parse(commentsJson).length : task.comments?.length) || 0;
          if (commentsCount > 0) return (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-[#00c875] transition-colors cursor-pointer"
              title={`${commentsCount} yorum`}
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick(task, 'comments');
              }}
            >
              <MessageSquare size={10} className="text-[#00c875]" />
              <span className="text-[9px] font-bold">{commentsCount}</span>
            </div>
          );
        })()}
      </div>

      {/* Labels Row */}
      <div className="mb-2">
        <InlineLabelPicker
          taskId={task._id}
          currentLabels={task.labels || []}
          projectId={projectId}
          onUpdate={(taskId, newLabels) => onUpdate(taskId, { labels: newLabels })}
        />
      </div>

      {/* Bottom Section - Assignee (Status Eliminated) */}
      <div className="flex items-center gap-2">
        {/* Assignee - Clickable to add/remove */}
        <button
          ref={assigneeButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowAssigneeMenu(!showAssigneeMenu);
          }}
          className="flex items-center -space-x-1.5 hover:scale-105 transition-transform"
        >
          {assignees.slice(0, 2).map((assignee, idx) => (
            <Avatar
              key={assignee.id || assignee._id}
              className="w-6 h-6 border-2 border-white dark:border-slate-700 ring-1 ring-gray-200 dark:ring-slate-600 hover:ring-blue-400 transition-all hover:z-10"
              style={{ zIndex: 2 - idx }}
              title={assignee.fullName}
            >
              <AvatarImage src={assignee.avatar} />
              <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                {assignee.fullName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
          {assignees.length > 2 && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-700">
              +{assignees.length - 2}
            </div>
          )}
          {assignees.length === 0 && (
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
              <User size={12} className="text-gray-400" />
            </div>
          )}
        </button>

        {/* Assignee Menu Portal */}
        {showAssigneeMenu && createPortal(
          <div
            ref={assigneeMenuRef}
            role="menu"
            className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 min-w-[200px] py-2"
            style={{
              position: 'fixed',
              top: `${assigneeMenuPosition.top}px`,
              left: `${assigneeMenuPosition.left}px`,
              zIndex: 999999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-100">
              Kişi Ata
            </div>
            <div className="max-h-48 overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id || user._id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAssignee(user.id || user._id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-[10px]">
                      {user.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left text-gray-900 dark:text-gray-200">{user.fullName}</span>
                  {(task.assignees || []).includes(user.id || user._id) && (
                    <span className="text-blue-600 text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
});

const KanbanViewV2 = ({ boardId, searchQuery, filters }) => {
  const { tasks, users, loading } = useDataState();
  const { fetchTasks, fetchLabels, updateTaskStatus, updateTask, deleteTask } = useDataActions();

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

  useEffect(() => {
    if (boardId) {
      // Optimize: Only fetch if we don't have tasks for this board
      const hasTasks = tasks.some(task => task.projectId === Number(boardId));
      if (!hasTasks) {
        fetchTasks(boardId);
      }
      // Ensure labels are loaded centrally
      fetchLabels(boardId);
    }
  }, [boardId, fetchTasks, fetchLabels]);

  const filteredTasks = React.useMemo(() => {
    let filtered = tasks.filter(task => task.projectId === Number(boardId));

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

      await updateTaskStatus(draggedTask._id, newStatus);
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
      startDate: new Date().toISOString()
    };

    try {
      // Use same base URL logic as api.js
      const getBaseUrl = () => {
        const envUrl = process.env.REACT_APP_BACKEND_URL;
        if (process.env.NODE_ENV === 'development') {
          return envUrl || 'http://localhost:8080';
        }
        return ''; // Production: relative path
      };

      const API_URL = getBaseUrl();
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        const createdTask = await response.json();
        await fetchTasks(boardId);
        // Set the new task ID to trigger auto-focus
        setJustCreatedTaskId(createdTask._id || createdTask.id);

        // Clear the focus target after a delay to prevent re-focusing on re-renders
        setTimeout(() => setJustCreatedTaskId(null), 2000);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
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
                  : 'bg-gray-100 dark:bg-slate-900/50 border-gray-200 dark:border-slate-800'
                  } border h-full overflow-hidden`}
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
                    {columnTasks.map(task => (
                      <CompactTaskCard
                        key={task._id}
                        task={task}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedTask?._id === task._id}
                        users={users}
                        projectId={boardId}
                        onStatusChange={handleStatusChange}
                        onTaskClick={handleTaskClick}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteRequest}
                        activeMenuTaskId={activeMenuTaskId}
                        onToggleMenu={setActiveMenuTaskId}
                        autoFocus={task._id === justCreatedTaskId}
                      />
                    ))}
                  </div>

                  {/* Empty State */}
                  {columnTasks.length === 0 && !isDropTarget && (
                    <div className="text-center py-20 px-4 opacity-50 bg-dashed border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl mt-2">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <Plus size={24} className="text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                      </div>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Görev Ekle</p>
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
