import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Calendar, User, Tag, TrendingUp, ChevronDown, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ModernTaskModal from './ModernTaskModal';
import NewTaskModal from './NewTaskModal';
import InlineLabelPicker from './InlineLabelPicker';

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
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-sm border border-transparent hover:border-gray-200"
        style={{
          backgroundColor: currentOption[colorKey],
          color: currentOption.textColor || 'white'
        }}
      >
        <span>{currentOption[labelKey]}</span>
        <ChevronDown size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" />
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
        className={`group inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all hover:bg-gray-100 ${isOverdue ? 'text-red-600' : 'text-gray-600'
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
          <Avatar key={assignee.id || assignee._id} className="w-5 h-5 border border-white ring-1 ring-gray-200 hover:z-10">
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

const MainTable = ({ boardId, searchQuery, filters }) => {
  const { tasks, users, fetchTasks, updateTask, updateTaskStatus } = useData();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialSection, setModalInitialSection] = useState('activity');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const [expandedRows, setExpandedRows] = useState(new Set());

  // Optimize data fetching: Only fetch if needed
  React.useEffect(() => {
    if (boardId) {
      // Check if we already have tasks for this project to avoid redundant fetching on view switch
      // This simple check assumes if we have ANY tasks for this project, we're good.
      // For more robustness, we could use a lastFetched timestamp in context.
      const hasTasks = tasks.some(t => t.projectId === boardId);
      if (!hasTasks) {
        console.log('🔄 Fetching tasks for boardId:', boardId);
        fetchTasks(boardId);
      }
    }
  }, [boardId, fetchTasks /* tasks dependency removed to prevent loop, relying on initial check */]);

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

  const toggleRow = (taskId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedRows(newExpanded);
  };

  const calculateProgress = (task) => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.status === 'done' ? 100 : 0;
    }
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

  const openTaskModal = (task, section = 'activity') => {
    setSelectedTask(task);
    setModalInitialSection(section);
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
      <div className="flex-1 overflow-auto bg-white relative">
        {/* 🎯 VERSİYON v0.4.0 */}
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-lg">
          v1.2.2 👤
        </div>

        <div className="min-w-max">
          {/* Table Header */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="flex">
              <div className="w-10 flex items-center justify-center py-2 border-r border-gray-200 bg-gray-50/90 backdrop-blur">
                <input type="checkbox" className="rounded w-3 h-3" />
              </div>
              <div className="w-8 flex items-center justify-center py-2 border-r border-gray-200 bg-gray-50/90 backdrop-blur">
                {/* Expander Column Header */}
              </div>
              <div className="w-72 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200 bg-gray-50/90 backdrop-blur">
                Görev
              </div>
              <div className="w-40 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200 bg-gray-50/90 backdrop-blur">
                Durum
              </div>
              <div className="w-32 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200 bg-gray-50/90 backdrop-blur">
                Öncelik
              </div>
              <div className="w-40 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200 bg-gray-50/90 backdrop-blur">
                Atanan
              </div>
              <div className="w-28 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200 bg-gray-50/90 backdrop-blur">
                Son Tarih
              </div>
              <div className="w-40 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200 bg-gray-50/90 backdrop-blur">
                Etiketler
              </div>
              <div className="w-28 px-3 py-2 font-semibold text-xs text-gray-600 border-r border-gray-200 bg-gray-50/90 backdrop-blur">
                İlerleme
              </div>
              <div className="w-20 px-3 py-2 font-semibold text-xs text-gray-600 bg-gray-50/90 backdrop-blur">
                Dosyalar
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {boardTasks.map((task, index) => {
              const taskAssignees = getAssignees(task.assignees);
              const taskLabels = task.labels || [];
              const priority = getPriorityData(task.priority);
              const isExpanded = expandedRows.has(task._id);
              const progress = calculateProgress(task);
              const hasSubtasks = task.subtasks && task.subtasks.length > 0;

              return (
                <React.Fragment key={task._id}>
                  {/* Main Task Row */}
                  <div className="flex hover:bg-[#f8f9fb] transition-all duration-200 border-b border-gray-100 group">
                    <div className="w-10 flex items-center justify-center py-3 border-r border-gray-100">
                      <input
                        type="checkbox"
                        className="rounded w-3.5 h-3.5 cursor-pointer transition-transform hover:scale-110"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="w-8 flex items-center justify-center py-3 border-r border-gray-100">
                      {hasSubtasks && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(task._id);
                          }}
                          className={`p-0.5 rounded hover:bg-gray-200 text-gray-400 transition-all ${isExpanded ? 'rotate-90 text-gray-600' : ''}`}
                        >
                          <ChevronDown size={14} fill="currentColor" className="transform -rotate-90 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                        </button>
                      )}
                    </div>
                    <div className="w-72 px-3 py-3 border-r border-gray-100">
                      <div
                        className="text-xs text-gray-900 hover:text-[#6366f1] transition-colors cursor-pointer font-medium flex items-center gap-2"
                        onClick={() => openTaskModal(task)}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(task.status) }}></div>
                        {task.title}
                        {hasSubtasks && (
                          <span className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">
                            {task.subtasks.length} alt
                          </span>
                        )}
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
                      <InlineLabelPicker
                        taskId={task._id}
                        currentLabels={task.labels || []}
                        projectId={boardId}
                        onUpdate={(taskId, newLabels) => updateTask(taskId, { labels: newLabels })}
                      />
                    </div>
                    <div className="w-28 px-3 py-3 border-r border-gray-100">
                      <div className="flex flex-col gap-1 w-full group/progress">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-gray-500">{progress}%</span>
                          {progress === 100 && <div className="text-[8px] text-green-600 font-bold">TAMAM</div>}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: progress === 100 ? '#00C875' : progress > 0 ? '#00c875' : 'transparent' // Monday Green
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-20 px-3 py-3 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskModal(task, 'files');
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50"
                      >
                        {task.attachments?.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <TrendingUp size={14} className="rotate-90" /> {/* File Icon Replacement */}
                            <span className="text-[10px] font-bold">{task.attachments.length}</span>
                          </div>
                        ) : (
                          <Plus size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Subtasks Accordion Row */}
                  {isExpanded && hasSubtasks && (
                    <div className="bg-gray-50/50 shadow-inner">
                      {task.subtasks.map((subtask, sIndex) => (
                        <div key={sIndex} className="flex border-b border-gray-100/50 pl-12 h-10 items-center hover:bg-gray-100 transition-colors">
                          <div className="w-8 border-r border-gray-100/50 h-full"></div> {/* Indent line */}
                          <div className="w-72 px-3 flex items-center gap-2 border-r border-gray-100/50 h-full">
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              readOnly
                              className="rounded-full w-3 h-3 border-gray-400 text-green-500 focus:ring-green-500"
                            />
                            <span className={`text-xs ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                              {subtask.title}
                            </span>
                          </div>
                          {/* Empty cells for columns to align structure */}
                          <div className="w-40 border-r border-gray-100/50 h-full"></div>
                          <div className="w-32 border-r border-gray-100/50 h-full"></div>
                          <div className="w-40 border-r border-gray-100/50 h-full"></div>
                          <div className="w-28 border-r border-gray-100/50 h-full"></div>
                          <div className="w-40 border-r border-gray-100/50 h-full"></div>
                          <div className="w-28 border-r border-gray-100/50 h-full"></div>
                          <div className="w-20 h-full"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Add New Task Row */}
          <div
            onClick={() => setShowNewTaskModal(true)}
            className="flex hover:bg-gray-50 transition-colors border-b border-gray-100 group cursor-pointer"
          >
            <div className="w-18 px-6 flex items-center justify-center py-2 border-r border-gray-100">
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
};

export default MainTable;
