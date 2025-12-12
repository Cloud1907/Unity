import React, { useState } from 'react';
import { MoreHorizontal, Plus, Calendar, User, Tag, TrendingUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ModernTaskModal from './ModernTaskModal';
import NewTaskModal from './NewTaskModal';

// Status ve priority tanımları
const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#c4c4c4' },
  { id: 'working', label: 'Devam Ediyor', color: '#fdab3d' },
  { id: 'stuck', label: 'Takıldı', color: '#e2445c' },
  { id: 'done', label: 'Tamamlandı', color: '#00c875' },
  { id: 'review', label: 'İncelemede', color: '#579bfc' }
];

const priorities = [
  { id: 'low', label: 'Düşük', color: '#c4c4c4', icon: '↓' },
  { id: 'medium', label: 'Orta', color: '#fdab3d', icon: '−' },
  { id: 'high', label: 'Yüksek', color: '#e2445c', icon: '↑' },
  { id: 'urgent', label: 'Acil', color: '#df2f4a', icon: '⇈' }
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
          <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300 z-10 shadow-sm">
            <div className="flex">
              <div className="w-12 flex items-center justify-center py-4 border-r border-gray-300">
                <input type="checkbox" className="rounded w-4 h-4" />
              </div>
              <div className="w-80 px-4 py-4 font-bold text-xs text-gray-700 border-r border-gray-300 uppercase tracking-wider">
                Görev
              </div>
              <div className="w-48 px-4 py-4 font-bold text-xs text-gray-700 border-r border-gray-300 flex items-center gap-2 uppercase tracking-wider">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]"></div>
                Durum
              </div>
              <div className="w-40 px-4 py-4 font-bold text-xs text-gray-700 border-r border-gray-300 flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp size={14} className="text-[#6366f1]" />
                Öncelik
              </div>
              <div className="w-48 px-4 py-4 font-bold text-xs text-gray-700 border-r border-gray-300 flex items-center gap-2 uppercase tracking-wider">
                <User size={14} className="text-[#6366f1]" />
                Atanan
              </div>
              <div className="w-32 px-4 py-4 font-bold text-xs text-gray-700 border-r border-gray-300 flex items-center gap-2 uppercase tracking-wider">
                <Calendar size={14} className="text-[#6366f1]" />
                Son Tarih
              </div>
              <div className="w-48 px-4 py-4 font-bold text-xs text-gray-700 border-r border-gray-300 flex items-center gap-2 uppercase tracking-wider">
                <Tag size={14} className="text-[#6366f1]" />
                Etiketler
              </div>
              <div className="w-32 px-4 py-4 font-bold text-xs text-gray-700 flex items-center gap-2 uppercase tracking-wider">
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
                  <div className="w-12 flex items-center justify-center py-4 border-r border-gray-100">
                    <input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="w-80 px-4 py-4 border-r border-gray-100">
                    <div className="font-normal text-gray-900 hover:text-[#0086c0] transition-colors">
                      {task.title}
                    </div>
                  </div>
                  <div className="w-48 px-4 py-4 border-r border-gray-100">
                    <button
                      className="px-3 py-1.5 rounded-full text-sm font-normal text-white transition-all hover:scale-105 hover:shadow-md"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getStatusLabel(task.status)}
                    </button>
                  </div>
                  <div className="w-40 px-4 py-4 border-r border-gray-100">
                    <button
                      className="px-3 py-1.5 rounded-lg text-sm font-normal transition-all hover:scale-105"
                      style={{
                        backgroundColor: `${priority.color}15`,
                        color: priority.color,
                        border: `1px solid ${priority.color}30`
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {priority.icon} {priority.label}
                    </button>
                  </div>
                  <div className="w-48 px-4 py-4 border-r border-gray-100">
                    <div className="flex items-center -space-x-2">
                      {taskAssignees.map(assignee => (
                        <Avatar key={assignee._id} className="w-7 h-7 border-2 border-white hover:scale-110 transition-transform">
                          <AvatarImage src={assignee.avatar} alt={assignee.fullName} />
                          <AvatarFallback style={{ backgroundColor: assignee.color }}>
                            {assignee.fullName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                  <div className="w-32 px-4 py-4 border-r border-gray-100">
                    <span className="text-sm text-gray-600">{formatDate(task.dueDate)}</span>
                  </div>
                  <div className="w-48 px-4 py-4 border-r border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {taskLabels.map((label, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded text-xs font-normal text-white bg-blue-500"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-32 px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${task.progress}%`,
                            backgroundColor: task.progress === 100 ? '#00c875' : '#0086c0'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Task Row */}
          <div className="flex hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100 group">
            <div className="w-12 flex items-center justify-center py-4 border-r border-gray-100">
              <Plus size={16} className="text-[#6366f1] group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1 px-4 py-4">
              <button className="text-sm font-medium text-[#6366f1] hover:text-[#4f46e5] transition-colors flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                <span>Yeni görev ekle</span>
                <div className="w-2 h-2 rounded-full bg-[#6366f1] opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
          onUpdate={(updatedTask) => {
            // Task güncellendiğinde listeyi yenile
            fetchTasks(boardId);
          }}
        />
      )}
    </>
  );
};

export default MainTable;
