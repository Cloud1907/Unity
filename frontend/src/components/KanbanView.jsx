import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { tasks, users, statuses, priorities, labels } from '../mockData';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import TaskModal from './TaskModal';

const KanbanView = ({ boardId }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);

  const boardTasks = tasks.filter(t => t.boardId === boardId);

  const getStatusData = (statusId) => {
    return statuses.find(s => s.id === statusId) || statuses[0];
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

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, statusId) => {
    e.preventDefault();
    if (draggedTask) {
      console.log(`Moving task ${draggedTask.id} to status ${statusId}`);
      // Mock status update
      setDraggedTask(null);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-x-auto bg-gray-50 p-6">
        <div className="flex gap-4 h-full min-w-max">
          {statuses.map(status => {
            const statusTasks = boardTasks.filter(t => t.status === status.id);
            
            return (
              <div
                key={status.id}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status.id)}
              >
                {/* Column Header */}
                <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <h3 className="font-semibold text-gray-900">{status.label}</h3>
                      <span className="text-sm text-gray-500">({statusTasks.length})</span>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <MoreHorizontal size={18} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Column Content */}
                <div className="bg-white border border-gray-200 rounded-b-lg p-2 min-h-[calc(100vh-300px)] max-h-[calc(100vh-300px)] overflow-y-auto">
                  <div className="space-y-3">
                    {statusTasks.map(task => {
                      const taskAssignees = getAssignees(task.assignees);
                      const taskLabels = getLabels(task.labels);
                      const priority = getPriorityData(task.priority);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onClick={() => openTaskModal(task)}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-move group"
                        >
                          {/* Task Labels */}
                          {taskLabels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
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
                          )}

                          {/* Task Title */}
                          <h4 className="font-medium text-gray-900 mb-3 group-hover:text-[#0086c0] transition-colors">
                            {task.title}
                          </h4>

                          {/* Task Meta */}
                          <div className="flex items-center justify-between">
                            {/* Priority */}
                            <div
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${priority.color}15`,
                                color: priority.color
                              }}
                            >
                              {priority.icon} {priority.label}
                            </div>

                            {/* Assignees */}
                            {taskAssignees.length > 0 && (
                              <div className="flex items-center -space-x-2">
                                {taskAssignees.slice(0, 3).map(assignee => (
                                  <Avatar key={assignee.id} className="w-6 h-6 border-2 border-white">
                                    <AvatarImage src={assignee.avatar} alt={assignee.name} />
                                    <AvatarFallback style={{ backgroundColor: assignee.color }}>
                                      {assignee.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {task.progress > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">İlerleme</span>
                                <span className="text-xs font-medium text-gray-700">{task.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${task.progress}%`,
                                    backgroundColor: task.progress === 100 ? '#00c875' : '#0086c0'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Task Button */}
                  <button className="w-full mt-3 p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-[#0086c0] hover:text-[#0086c0] transition-colors flex items-center justify-center gap-2">
                    <Plus size={16} />
                    Görev Ekle
                  </button>
                </div>
              </div>
            );
          })}
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

export default KanbanView;
