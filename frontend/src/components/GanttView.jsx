import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import TaskModal from './TaskModal';

const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#c4c4c4' },
  { id: 'working', label: 'Devam Ediyor', color: '#fdab3d' },
  { id: 'stuck', label: 'Takıldı', color: '#e2445c' },
  { id: 'done', label: 'Tamamlandı', color: '#00c875' },
  { id: 'review', label: 'İncelemede', color: '#579bfc' }
];

const GanttView = ({ boardId }) => {
  const { tasks, fetchTasks } = useData();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch tasks when boardId changes
  React.useEffect(() => {
    if (boardId) {
      fetchTasks(boardId);
    }
  }, [boardId]);

  const boardTasks = tasks.filter(t => t.projectId === boardId);

  const getStatusColor = (statusId) => {
    return statuses.find(s => s.id === statusId)?.color || '#c4c4c4';
  };

  // Generate timeline (next 60 days)
  const generateTimeline = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const timeline = generateTimeline();

  const getDayPosition = (dateString) => {
    const taskDate = new Date(dateString);
    const today = new Date();
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(diffDays, 59));
  };

  const getTaskDuration = (createdAt, dueDate) => {
    const start = new Date(createdAt);
    const end = new Date(dueDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-max">
          {/* Timeline Header */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <div className="flex">
              <div className="w-64 px-4 py-3 font-semibold text-sm text-gray-700 border-r border-gray-200">
                Görev Adı
              </div>
              <div className="flex">
                {timeline.map((date, index) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div
                      key={index}
                      className={`w-12 px-1 py-3 text-center border-r border-gray-200 ${
                        isWeekend ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-600">
                        {date.getDate()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gantt Rows */}
          <div>
            {boardTasks.map(task => {
              const startPosition = getDayPosition(task.createdAt);
              const duration = getTaskDuration(task.createdAt, task.dueDate);

              return (
                <div key={task.id} className="flex hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <div className="w-64 px-4 py-4 border-r border-gray-100">
                    <div className="font-medium text-sm text-gray-900">{task.title}</div>
                  </div>
                  <div className="flex-1 relative h-16">
                    {/* Background grid */}
                    <div className="absolute inset-0 flex">
                      {timeline.map((date, index) => {
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (
                          <div
                            key={index}
                            className={`w-12 border-r border-gray-100 ${
                              isWeekend ? 'bg-gray-50' : ''
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Task bar */}
                    <div
                      onClick={() => openTaskModal(task)}
                      className="absolute top-1/2 transform -translate-y-1/2 h-8 rounded-lg cursor-pointer hover:opacity-80 transition-all hover:scale-105 flex items-center justify-between px-3 shadow-md"
                      style={{
                        left: `${startPosition * 48}px`,
                        width: `${duration * 48}px`,
                        backgroundColor: getStatusColor(task.status),
                        minWidth: '48px'
                      }}
                    >
                      <span className="text-xs font-medium text-white truncate">
                        {task.title}
                      </span>
                      <span className="text-xs text-white opacity-75 ml-2">
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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

export default GanttView;
