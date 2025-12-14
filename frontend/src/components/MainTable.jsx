import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Calendar, User, Tag, TrendingUp, ChevronDown, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ModernTaskModal from './ModernTaskModal';
import NewTaskModal from './NewTaskModal';

// Monday.com renk paleti
const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#C4C4C4' },
  { id: 'working', label: 'Devam Ediyor', color: '#FDAB3D' },
  { id: 'stuck', label: 'Takıldı', color: '#E2445C' },
  { id: 'done', label: 'Tamamlandı', color: '#00C875' },
  { id: 'review', label: 'İncelemede', color: '#579BFC' }
];

const priorities = [
  { id: 'low', label: 'Düşük', color: '#C4C4C4', icon: '↓' },
  { id: 'medium', label: 'Orta', color: '#FDAB3D', icon: '−' },
  { id: 'high', label: 'Yüksek', color: '#E2445C', icon: '↑' },
  { id: 'urgent', label: 'Acil', color: '#DF2F4A', icon: '⇈' }
];

// Inline dropdown component
const InlineDropdown = ({ value, options, onChange, colorKey = 'color', labelKey = 'label' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentOption = options.find(opt => opt.id === value) || options[0];

  return (
    <div ref={dropdownRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 hover:shadow-md"
        style={{ backgroundColor: currentOption[colorKey] }}
      >
        <span>{currentOption[labelKey]}</span>
        <ChevronDown size={12} className="opacity-70 group-hover:opacity-100 transition-opacity" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 min-w-[160px] py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: option[colorKey] }}
              />
              <span className="text-gray-900">{option[labelKey]}</span>
              {value === option.id && (
                <span className="ml-auto text-[#6366f1]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Inline date picker component
const InlineDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const isOverdue = new Date(value) < new Date();

  return (
    <div ref={datePickerRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all hover:bg-gray-100 ${
          isOverdue ? 'text-red-600' : 'text-gray-600'
        }`}
      >
        <Calendar size={12} />
        <span>{formatDate(value)}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            type="date"
            value={new Date(value).toISOString().split('T')[0]}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(false);
            }}
            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
          />
        </div>
      )}
    </div>
  );
};

// Inline assignee picker component
const InlineAssigneePicker = ({ assigneeIds, allUsers, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const assignees = allUsers.filter(u => assigneeIds?.includes(u._id));

  const toggleAssignee = (userId) => {
    const newAssignees = assigneeIds?.includes(userId)
      ? assigneeIds.filter(id => id !== userId)
      : [...(assigneeIds || []), userId];
    onChange(newAssignees);
  };

  return (
    <div ref={pickerRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center -space-x-1.5 hover:scale-105 transition-transform"
      >
        {assignees.slice(0, 3).map(assignee => (
          <Avatar key={assignee._id} className="w-5 h-5 border border-white ring-1 ring-gray-200 hover:z-10">
            <AvatarImage src={assignee.avatar} alt={assignee.fullName} />
            <AvatarFallback className="text-[10px]">
              {assignee.fullName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        ))}
        {assignees.length > 3 && (
          <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center">
            <span className="text-[8px] font-semibold text-gray-600">
              +{assignees.length - 3}
            </span>
          </div>
        )}
        {assignees.length === 0 && (
          <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#6366f1] hover:bg-blue-50">
            <Plus size={10} className="text-gray-400" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 min-w-[200px] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 border-b border-gray-100 mb-1">
            Atanan Kişiler
          </div>
          <div className="max-h-48 overflow-y-auto">
            {allUsers.map(user => (
              <button
                key={user.id || user._id}
                onClick={() => toggleAssignee(user.id || user._id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {user.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-left text-gray-900">{user.fullName}</span>
                {assigneeIds?.includes(user.id || user._id) && (
                  <span className="text-[#6366f1]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MainTable = ({ boardId }) => {
  const { tasks, users, fetchTasks, updateTask, updateTaskStatus } = useData();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  
  // Fetch tasks when boardId changes
  React.useEffect(() => {
    if (boardId) {
      console.log('🔄 Fetching tasks for boardId:', boardId);
      fetchTasks(boardId);
    }
  }, [boardId]);
  
  // Debug logging
  React.useEffect(() => {
    console.log('📊 MainTable render - boardId:', boardId);
    console.log('📊 MainTable render - all tasks:', tasks);
    const filtered = tasks.filter(t => t.projectId === boardId);
    console.log('📊 MainTable render - filtered tasks:', filtered);
  }, [boardId, tasks]);
  
  const boardTasks = React.useMemo(() => {
    if (!boardId) return [];
    return tasks.filter(t => t.projectId === boardId);
  }, [tasks, boardId]);

  const getStatusColor = (statusId) => {
    return statuses.find(s => s.id === statusId)?.color || '#c4c4c4';
  };

  const getStatusLabel = (statusId) => {
    return statuses.find(s => s.id === statusId)?.label || 'Bilinmiyor';
  };

  const getPriorityData = (priorityId) => {
    return priorities.find(p => p.id === priorityId) || priorities[0];
  };

  const getAssignees = (assigneeIds) => {
    return users.filter(u => assigneeIds?.includes(u.id || u._id));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Show empty state if no board selected
  if (!boardId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <p className="text-lg">Bir proje seçin veya yeni proje oluşturun</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-max">
          {/* Table Header */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="flex">
              <div className="w-10 flex items-center justify-center py-2 border-r border-gray-200">
                <input type="checkbox" className="rounded w-3 h-3" />
              </div>
              <div className="w-72 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200">
                Görev
              </div>
              <div className="w-40 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200">
                Durum
              </div>
              <div className="w-32 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200">
                Öncelik
              </div>
              <div className="w-40 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200">
                Atanan
              </div>
              <div className="w-28 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200">
                Son Tarih
              </div>
              <div className="w-40 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200">
                Etiketler
              </div>
              <div className="w-28 px-3 py-2 font-semibold text-xs text-gray-600">
                İlerleme
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {boardTasks.map((task, index) => {
              const taskAssignees = getAssignees(task.assignees);
              const taskLabels = task.labels || [];
              const priority = getPriorityData(task.priority);
              
              return (
                <div
                  key={task._id}
                  className="flex hover:bg-[#f8f9fb] transition-all duration-200 border-b border-gray-100 group"
                >
                  <div className="w-10 flex items-center justify-center py-3 border-r border-gray-100">
                    <input 
                      type="checkbox" 
                      className="rounded w-3.5 h-3.5 cursor-pointer transition-transform hover:scale-110" 
                      onClick={(e) => e.stopPropagation()} 
                    />
                  </div>
                  <div className="w-72 px-3 py-3 border-r border-gray-100">
                    <div 
                      className="text-xs text-gray-900 hover:text-[#6366f1] transition-colors cursor-pointer font-medium"
                      onClick={() => openTaskModal(task)}
                    >
                      {task.title}
                    </div>
                  </div>
                  <div className="w-40 px-3 py-3 border-r border-gray-100">
                    <InlineDropdown
                      value={task.status}
                      options={statuses}
                      onChange={(newStatus) => updateTaskStatus(task._id, newStatus)}
                    />
                  </div>
                  <div className="w-32 px-3 py-3 border-r border-gray-100">
                    <InlineDropdown
                      value={task.priority}
                      options={priorities}
                      onChange={(newPriority) => updateTask(task._id, { priority: newPriority })}
                    />
                  </div>
                  <div className="w-40 px-3 py-3 border-r border-gray-100">
                    <InlineAssigneePicker
                      assigneeIds={task.assignees}
                      allUsers={users}
                      onChange={(newAssignees) => updateTask(task._id, { assignees: newAssignees })}
                    />
                  </div>
                  <div className="w-28 px-3 py-3 border-r border-gray-100">
                    <InlineDatePicker
                      value={task.dueDate}
                      onChange={(newDate) => updateTask(task._id, { dueDate: newDate })}
                    />
                  </div>
                  <div className="w-40 px-3 py-3 border-r border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {taskLabels.map((label, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-28 px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-300 ease-out"
                          style={{
                            width: `${task.progress}%`,
                            backgroundColor: task.progress === 100 ? '#00C875' : '#579BFC'
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 w-8 font-medium">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Task Row */}
          <div 
            onClick={() => setShowNewTaskModal(true)}
            className="flex hover:bg-gray-50 transition-colors border-b border-gray-100 group cursor-pointer"
          >
            <div className="w-10 flex items-center justify-center py-2 border-r border-gray-100">
              <Plus size={14} className="text-[#6366f1]" />
            </div>
            <div className="flex-1 px-3 py-2">
              <button className="text-xs font-medium text-[#6366f1] hover:text-[#4f46e5] transition-colors">
                Yeni görev ekle
              </button>
            </div>
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
};

export default MainTable;
