import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, MoreHorizontal, User, Calendar } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ModernTaskModal from './ModernTaskModal';
import confetti from 'canvas-confetti';

// Monday.com renk paleti - TAM eşleşme
const STATUS_COLORS = {
  todo: { bg: '#C4C4C4', text: '#323338', label: 'Yapılacak', lightBg: '#f0f0f0' },
  working: { bg: '#FDAB3D', text: '#FFFFFF', label: 'Devam Ediyor', lightBg: '#fff4e6' },
  review: { bg: '#579BFC', text: '#FFFFFF', label: 'İncelemede', lightBg: '#e8f2ff' },
  done: { bg: '#00C875', text: '#FFFFFF', label: 'Tamamlandı', lightBg: '#e6f7ed' },
  stuck: { bg: '#E2445C', text: '#FFFFFF', label: 'Takıldı', lightBg: '#ffe6ea' }
};

// Konfeti efekti
const celebrateTask = () => {
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
  }, 250);
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
          className="bg-white rounded-xl shadow-2xl border border-gray-200 min-w-[180px] py-2"
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
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold hover:bg-gray-50 transition-all group"
            >
              <div
                className="w-4 h-4 rounded-md transition-transform group-hover:scale-110"
                style={{ backgroundColor: config.bg }}
              />
              <span className="text-gray-900 flex-1 text-left">{config.label}</span>
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
  urgent: { color: '#DF2F4A', label: 'Acil', icon: '⇈' },
  high: { color: '#E2445C', label: 'Yüksek', icon: '↑' },
  medium: { color: '#FDAB3D', label: 'Orta', icon: '−' },
  low: { color: '#C4C4C4', label: 'Düşük', icon: '↓' }
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
          className="bg-white rounded-lg shadow-2xl border border-gray-200 min-w-[140px] py-1"
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
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-gray-50"
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
      // Seçili tarih varsa o ayı göster
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

  // Takvim hesaplamaları
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Pazar
    
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

  const dayNames = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']; // Pzt, Sal, Çar, Per, Cum, Cmt, Paz

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all hover:bg-gray-100 ${
          isOverdue ? 'text-red-600 bg-red-50' : value ? 'text-gray-600' : 'text-gray-400'
        }`}
      >
        <Calendar size={11} />
        <span>{formatDate(value)}</span>
      </button>

      {isOpen && createPortal(
        <div 
          ref={datePickerRef}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 999999,
            width: '280px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ay başlığı ve navigasyon */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-gray-900 capitalize">{monthName}</span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Gün başlıkları */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, idx) => (
              <div key={idx} className="text-center text-xs font-semibold text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Takvim günleri */}
          <div className="grid grid-cols-7 gap-1">
            {/* Boş hücreler (ayın başlangıcı için) */}
            {Array.from({ length: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}
            
            {/* Günler */}
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

          {/* Alt butonlar */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => {
                onChange(new Date().toISOString());
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
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

// Kompakt Task Card - Monday.com stili
const CompactTaskCard = ({ task, onDragStart, onDragEnd, isDragging, users, onStatusChange, onTaskClick, onUpdate }) => {
  const assignees = users.filter(u => task.assignees?.includes(u.id || u._id));
  const [isHovered, setIsHovered] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [assigneeMenuPosition, setAssigneeMenuPosition] = useState({ top: 0, left: 0 });
  const assigneeButtonRef = useRef(null);
  const assigneeMenuRef = useRef(null);

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

  // Close assignee menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(event.target) &&
          assigneeButtonRef.current && !assigneeButtonRef.current.contains(event.target)) {
        setShowAssigneeMenu(false);
      }
    };
    if (showAssigneeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAssigneeMenu]);

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
      className={`bg-white rounded-lg p-3 border transition-all duration-200 cursor-pointer group ${
        isDragging 
          ? 'opacity-50 scale-95 shadow-2xl rotate-2' 
          : 'opacity-100 hover:shadow-xl hover:scale-[1.02] border-gray-200 hover:border-blue-400'
      }`}
      style={{
        transform: isDragging ? 'rotate(2deg)' : 'rotate(0deg)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Task Title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-900 leading-tight flex-1 line-clamp-2">
          {task.title}
        </h4>
        <button 
          className={`p-1 rounded hover:bg-gray-100 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onTaskClick(task);
          }}
        >
          <MoreHorizontal size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Priority & Date Row */}
      <div className="flex items-center gap-2 mb-3">
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

      {/* Bottom Section - Assignee & Status */}
      <div className="flex items-center justify-between gap-2">
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
              className="w-6 h-6 border-2 border-white ring-1 ring-gray-200 hover:ring-blue-400 transition-all hover:z-10"
              style={{ zIndex: 2 - idx }}
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
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all">
              <User size={12} className="text-gray-400" />
            </div>
          )}
        </button>

        {/* Assignee Menu Portal */}
        {showAssigneeMenu && createPortal(
          <div 
            ref={assigneeMenuRef}
            role="menu"
            className="bg-white rounded-lg shadow-2xl border border-gray-200 min-w-[200px] py-2"
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-[10px]">
                      {user.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left text-gray-900">{user.fullName}</span>
                  {(task.assignees || []).includes(user.id || user._id) && (
                    <span className="text-blue-600 text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}

        {/* Inline Status Dropdown */}
        <InlineStatusDropdown
          currentStatus={task.status}
          taskId={task._id}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
};

const KanbanViewV2 = ({ boardId }) => {
  const { tasks, users, fetchTasks, updateTaskStatus, updateTask } = useData();
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchTasks(boardId);
    }
  }, [boardId, fetchTasks]);

  useEffect(() => {
    const filtered = tasks.filter(task => task.projectId === boardId);
    setFilteredTasks(filtered);
  }, [tasks, boardId]);

  const columns = [
    { id: 'todo', title: 'Yapılacak', color: STATUS_COLORS.todo.bg, lightBg: STATUS_COLORS.todo.lightBg },
    { id: 'working', title: 'Devam Ediyor', color: STATUS_COLORS.working.bg, lightBg: STATUS_COLORS.working.lightBg },
    { id: 'review', title: 'İncelemede', color: STATUS_COLORS.review.bg, lightBg: STATUS_COLORS.review.lightBg },
    { id: 'done', title: 'Tamamlandı', color: STATUS_COLORS.done.bg, lightBg: STATUS_COLORS.done.lightBg },
    { id: 'stuck', title: 'Takıldı', color: STATUS_COLORS.stuck.bg, lightBg: STATUS_COLORS.stuck.lightBg }
  ];

  const getTasksByStatus = (status) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, newStatus) => {
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
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTaskStatus(taskId, newStatus);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTask(null);
  };

  const handleAddTask = async (columnId) => {
    // Quick add - create task with minimal data
    const newTask = {
      title: 'Yeni Görev',
      projectId: boardId,
      status: columnId,
      priority: 'medium',
      assignees: [],
      progress: 0,
      labels: [],
      subtasks: []
    };
    
    // Call backend API to create task
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
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
        await fetchTasks(boardId);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-visible">
      {/* 🎯 VERSİYON v0.3.4 */}
      <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded shadow-lg">
        v0.3.4 📅
      </div>

      {/* Kanban Board */}
      <div className="h-full overflow-x-auto overflow-y-visible">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.id);
            const isDropTarget = dragOverColumn === column.id;
            
            return (
              <div
                key={column.id}
                className={`flex flex-col w-72 rounded-xl transition-all duration-300 ${
                  isDropTarget
                    ? 'ring-4 ring-blue-400 ring-opacity-50 scale-105 shadow-2xl'
                    : 'scale-100'
                } bg-transparent`}
                style={{ 
                  minHeight: '500px'
                }}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header - Monday.com style */}
                <div 
                  className="mb-3 px-4 py-3 rounded-t-xl backdrop-blur-sm"
                  style={{ 
                    backgroundColor: `${column.color}15`,
                    borderLeft: `4px solid ${column.color}`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">
                        {column.title}
                      </span>
                      <span 
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-white min-w-[28px] text-center"
                        style={{ backgroundColor: column.color }}
                      >
                        {columnTasks.length}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleAddTask(column.id)}
                      className="p-1.5 hover:bg-white/60 rounded-lg transition-all duration-200 hover:scale-110 hover:rotate-90"
                    >
                      <Plus size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                <div 
                  className="flex-1 overflow-visible px-3 pb-3 space-y-2.5 rounded-b-xl"
                  style={{ 
                    background: isDropTarget 
                      ? `linear-gradient(to bottom, transparent 0%, ${column.color}20 100%)`
                      : `linear-gradient(to bottom, transparent 0%, ${column.lightBg} 100%)`,
                    maxHeight: '600px',
                    overflowY: 'scroll'
                  }}
                >
                  {columnTasks.map(task => (
                    <CompactTaskCard
                      key={task._id}
                      task={task}
                      users={users}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedTask?._id === task._id}
                      onStatusChange={handleStatusChange}
                      onTaskClick={handleTaskClick}
                      onUpdate={updateTask}
                    />
                  ))}

                  {/* Empty State */}
                  {columnTasks.length === 0 && !isDropTarget && (
                    <div className="text-center py-12 px-4">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/60 flex items-center justify-center">
                        <Plus size={24} className="text-gray-300" />
                      </div>
                      <p className="text-xs text-gray-400 font-medium">Buraya sürükle</p>
                    </div>
                  )}

                  {/* Drop Zone Indicator */}
                  {isDropTarget && (
                    <div 
                      className="border-4 border-dashed rounded-xl p-8 text-center animate-pulse"
                      style={{ borderColor: column.color }}
                    >
                      <div className="text-sm font-bold" style={{ color: column.color }}>
                        ↓ Buraya Bırak ↓
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
      {isDetailOpen && selectedTask && (
        <ModernTaskModal
          task={selectedTask}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default KanbanViewV2;
