import React, { useState } from 'react';
import { MoreHorizontal, Plus, Calendar, User, Tag, TrendingUp } from 'lucide-react';
import { tasks, users, statuses, priorities, labels } from '../mockData';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import TaskModal from './TaskModal';

const MainTable = ({ boardId }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const boardTasks = tasks.filter(t => t.boardId === boardId);

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
    return users.filter(u => assigneeIds.includes(u.id));
  };

  const getLabels = (labelIds) => {
    return labels.filter(l => labelIds.includes(l.id));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-max">
          {/* Table Header */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="flex">
              <div className="w-12 flex items-center justify-center py-3 border-r border-gray-200">
                <input type="checkbox" className="rounded" />
              </div>
              <div className="w-80 px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200">
                Görev
              </div>
              <div className="w-48 px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                Durum
              </div>
              <div className="w-40 px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200 flex items-center gap-2">
                <TrendingUp size={14} />
                Öncelik
              </div>
              <div className="w-48 px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200 flex items-center gap-2">
                <User size={14} />
                Atanan
              </div>
              <div className="w-32 px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200 flex items-center gap-2">
                <Calendar size={14} />
                Son Tarih
              </div>
              <div className="w-48 px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200 flex items-center gap-2">
                <Tag size={14} />
                Etiketler
              </div>
              <div className="w-32 px-4 py-3 font-medium text-sm text-gray-700 flex items-center gap-2">
                İlerleme
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div>
            {boardTasks.map((task, index) => {
              const taskAssignees = getAssignees(task.assignees);
              const taskLabels = getLabels(task.labels);
              const priority = getPriorityData(task.priority);
              
              return (
                <div
                  key={task.id}
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
                      className="px-3 py-1.5 rounded-full text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-md"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getStatusLabel(task.status)}
                    </button>
                  </div>
                  <div className="w-40 px-4 py-4 border-r border-gray-100">
                    <button
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
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
                        <Avatar key={assignee.id} className="w-7 h-7 border-2 border-white hover:scale-110 transition-transform">
                          <AvatarImage src={assignee.avatar} alt={assignee.name} />
                          <AvatarFallback style={{ backgroundColor: assignee.color }}>
                            {assignee.name.charAt(0)}
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
                      {taskLabels.map(label => (
                        <span
                          key={label.id}
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
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
          <div className="flex hover:bg-gray-50 transition-colors border-b border-gray-100">
            <div className="w-12 flex items-center justify-center py-4 border-r border-gray-100">
              <Plus size={16} className="text-gray-400" />
            </div>
            <div className="flex-1 px-4 py-4">
              <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Yeni görev ekle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default MainTable;
