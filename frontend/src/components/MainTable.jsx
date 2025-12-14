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

const MainTable = ({ boardId }) => {
  const { tasks, users, fetchTasks } = useData();
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
    return users.filter(u => assigneeIds?.includes(u._id));
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
                  className="flex hover:bg-gray-50 transition-colors border-b border-gray-100 group cursor-pointer"
                  onClick={() => openTaskModal(task)}
                >
                  <div className="w-10 flex items-center justify-center py-2 border-r border-gray-100">
                    <input type="checkbox" className="rounded w-3 h-3" onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="w-72 px-3 py-2 border-r border-gray-100">
                    <div className="text-xs text-gray-900 hover:text-[#6366f1] transition-colors">
                      {task.title}
                    </div>
                  </div>
                  <div className="w-40 px-3 py-2 border-r border-gray-100">
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getStatusLabel(task.status)}
                    </button>
                  </div>
                  <div className="w-32 px-3 py-2 border-r border-gray-100">
                    <button
                      className="px-2 py-1 rounded text-xs transition-all"
                      style={{
                        backgroundColor: `${priority.color}15`,
                        color: priority.color
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {priority.icon} {priority.label}
                    </button>
                  </div>
                  <div className="w-40 px-3 py-2 border-r border-gray-100">
                    <div className="flex items-center -space-x-1.5">
                      {taskAssignees.map(assignee => (
                        <Avatar key={assignee._id} className="w-5 h-5 border border-white">
                          <AvatarImage src={assignee.avatar} alt={assignee.fullName} />
                          <AvatarFallback>
                            {assignee.fullName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                  <div className="w-28 px-3 py-2 border-r border-gray-100">
                    <span className="text-xs text-gray-600">{formatDate(task.dueDate)}</span>
                  </div>
                  <div className="w-40 px-3 py-2 border-r border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {taskLabels.map((label, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-xs text-white bg-blue-500"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-28 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${task.progress}%`,
                            backgroundColor: task.progress === 100 ? '#00c875' : '#6366f1'
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{task.progress}%</span>
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
