import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import ModernTaskModal from './ModernTaskModal';
import { User, Calendar, Layers, ChevronDown, ChevronRight } from 'lucide-react';

const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#c4c4c4' },
  { id: 'working', label: 'Devam Ediyor', color: '#fdab3d' },
  { id: 'stuck', label: 'Takıldı', color: '#e2445c' },
  { id: 'done', label: 'Tamamlandı', color: '#00c875' },
  { id: 'review', label: 'İncelemede', color: '#579bfc' }
];

const GanttView = ({ boardId }) => {
  const { tasks, fetchTasks, users } = useData();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupBy, setGroupBy] = useState('none'); // 'none' | 'user'
  const [expandedTasks, setExpandedTasks] = useState({});

  const toggleSubtasks = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Fetch tasks when boardId changes
  React.useEffect(() => {
    if (boardId) {
      fetchTasks(boardId);
    }
  }, [boardId]);



  const boardTasks = useMemo(() =>
    tasks.filter(t => t.projectId === Number(boardId)),
    [tasks, boardId]);

  // Auto-expand tasks with subtasks on initial load
  React.useEffect(() => {
    if (boardTasks.length > 0) {
      const newExpanded = {};
      let hasChange = false;
      boardTasks.forEach(task => {
        if (task.subtasks && task.subtasks.length > 0) {
          newExpanded[task._id] = true;
          hasChange = true;
        }
      });
      if (hasChange) {
        setExpandedTasks(prev => ({ ...prev, ...newExpanded }));
      }
    }
  }, [boardTasks]);

  const getStatusColor = (statusId) => {
    return statuses.find(s => s.id === statusId)?.color || '#c4c4c4';
  };

  // Generate timeline (next 45 days)
  const timeline = useMemo(() => {
    const days = [];
    const today = new Date();
    // Start 2 days ago to show context
    const start = new Date(today);
    start.setDate(today.getDate() - 2);

    for (let i = 0; i < 45; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  const timelineStart = timeline[0];

  const getDayPosition = (dateString) => {
    if (!dateString) return 0;
    const taskDate = new Date(dateString);
    const diffTime = taskDate - timelineStart;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Allow negative for overdue/past context, but cap max
    return Math.max(-5, Math.min(diffDays, 50));
  };

  const getTaskDuration = (createdAt, dueDate) => {
    const start = new Date(createdAt);
    const end = dueDate ? new Date(dueDate) : new Date(start.getTime() + 86400000); // Default 1 day
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Grouping Logic
  const groupedTasks = useMemo(() => {
    if (groupBy === 'user') {
      const groups = {};
      // Initialize with unassigned
      groups['Unassigned'] = {
        id: 'unassigned',
        name: 'Atanmamış',
        avatar: null,
        tasks: []
      };

      boardTasks.forEach(task => {
        if (!task.assignees || task.assignees.length === 0) {
          groups['Unassigned'].tasks.push(task);
        } else {
          task.assignees.forEach(userId => {
            if (!groups[userId]) {
              const user = users.find(u => u._id === userId || u.id === userId);
              groups[userId] = {
                id: userId,
                name: user?.fullName || 'Bilinmeyen',
                avatar: user?.avatar,
                tasks: []
              };
            }
            // Avoid duplicates if we want unique rows per task, 
            // but for user grouping, highlighting the same task under multiple users is okay?
            // Actually Gantt usually shows task once. 
            // Let's assign to PRIMARY (first) assignee only to avoid clutter for now.
            if (task.assignees[0] === userId) {
              groups[userId].tasks.push(task);
            }
          });
        }
      });

      return Object.values(groups).filter(g => g.tasks.length > 0);
    }
    return [{ id: 'all', name: 'Tüm Görevler', tasks: boardTasks }];
  }, [boardTasks, groupBy, users]);

  const getUserAvatar = (userId) => {
    const user = users.find(u => u._id === Number(userId) || u.id === Number(userId));
    return user?.avatar;
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-[#0f172a]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGroupBy('none')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${groupBy === 'none' ? 'bg-white shadow text-indigo-600 dark:bg-gray-800 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <Layers size={14} />
              Liste Görünümü
            </button>
            <button
              onClick={() => setGroupBy('user')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${groupBy === 'user' ? 'bg-white shadow text-indigo-600 dark:bg-gray-800 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <User size={14} />
              Kişiye Göre
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Tamamlandı
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Devam Ediyor
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="min-w-max">
            {/* Timeline Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-20 shadow-sm">
              <div className="flex">
                <div className="w-80 px-4 py-3 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur">
                  Görev Detayları
                </div>
                <div className="flex">
                  {timeline.map((date, index) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={index}
                        className={`w-12 px-1 py-2 text-center border-r border-gray-100 dark:border-gray-800 ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''} ${isWeekend ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''
                          }`}
                      >
                        <div className={`text-[10px] font-bold mb-0.5 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm font-bold ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Gantt Body */}
            <div>
              {groupedTasks.map((group) => (
                <React.Fragment key={group.id}>
                  {/* Group Header (only if grouping is active) */}
                  {groupBy !== 'none' && (
                    <div className="sticky left-0 right-0 px-4 py-2 bg-gray-100 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2 backdrop-blur z-10">
                      {group.avatar && (
                        <img src={group.avatar.startsWith('http') ? group.avatar : `http://localhost:8080${group.avatar}`} className="w-5 h-5 rounded-full" alt="" />
                      )}
                      {group.name}
                      <span className="text-xs font-normal text-gray-500 ml-2">({group.tasks.length} Görev)</span>
                    </div>
                  )}

                  {group.tasks.map(task => {
                    const startProp = task.startDate || task.createdAt; // Fallback to createdAt
                    const startPosition = getDayPosition(startProp);
                    const duration = getTaskDuration(startProp, task.dueDate);

                    // Safety: don't render if completely out of view (e.g. ancient tasks)
                    // But since we have a scrollable area, we render. 
                    // Maybe improve later.

                    const assigneeAvatar = task.assignees && task.assignees.length > 0 ? getUserAvatar(task.assignees[0]) : null;

                    return (
                      <React.Fragment key={task._id}>
                        <div className="flex hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800/50 group">
                          {/* Left Column: Task Info */}
                          <div className="w-80 px-4 py-3 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-center bg-white dark:bg-[#0f172a] sticky left-0 z-10 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 transition-colors shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1 overflow-hidden">
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleSubtasks(task._id); }}
                                    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"
                                  >
                                    {expandedTasks[task._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                )}
                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-200 truncate cursor-pointer hover:text-indigo-600" onClick={() => openTaskModal(task)} title={task.title}>
                                  {task.title}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${task.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                                task.status === 'working' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                {statuses.find(s => s.id === task.status)?.label || task.status}
                              </span>
                              {assigneeAvatar && (
                                <img
                                  src={assigneeAvatar.startsWith('http') ? assigneeAvatar : `http://localhost:8080${assigneeAvatar}`}
                                  alt="Assignee"
                                  className="w-4 h-4 rounded-full border border-gray-200"
                                  title="Atanan Kişi"
                                />
                              )}
                              {task.dueDate && (
                                <span className={`text-[10px] flex items-center gap-0.5 ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>
                                  <Calendar size={10} />
                                  {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Timeline */}
                          <div className="flex-1 relative h-16 min-w-max">
                            {/* Grid Background */}
                            <div className="absolute inset-0 flex h-full">
                              {timeline.map((date, index) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isToday = date.toDateString() === new Date().toDateString();
                                return (
                                  <div
                                    key={index}
                                    className={`w-12 border-r border-gray-100/50 dark:border-gray-800/50 h-full ${isToday ? 'bg-blue-50/30' : ''
                                      } ${isWeekend ? 'bg-gray-50/40 dark:bg-gray-800/20' : ''}`}
                                  />
                                );
                              })}
                            </div>

                            {/* Current Time Line */}
                            <div
                              className="absolute top-0 bottom-0 border-l-2 border-blue-500 z-0 pointer-events-none opacity-50 dashed w-px"
                              style={{ left: `${getDayPosition(new Date()) * 48 + 24}px` }}
                            ></div>

                            {/* Task Bar */}
                            <div
                              onClick={() => openTaskModal(task)}
                              className="absolute top-1/2 transform -translate-y-1/2 h-8 rounded-md cursor-pointer hover:brightness-110 transition-all shadow-sm border border-black/5 flex items-center justify-between px-2 z-0 group/bar"
                              style={{
                                left: `${Math.max(0, startPosition * 48)}px`,
                                width: `${duration * 48}px`,
                                backgroundColor: getStatusColor(task.status),
                                minWidth: '24px'
                              }}
                              title={`${task.title} - ${task.assignees?.length} Kişi`}
                            >
                              {/* Title and Progress */}
                              <div className="flex items-center gap-2 overflow-hidden flex-1">
                                {duration > 1 && (
                                  <span className="text-[10px] font-bold text-white truncate drop-shadow-md">
                                    {task.title}
                                  </span>
                                )}
                              </div>

                              {/* Assignee Avatars on the Bar */}
                              <div className="flex -space-x-1.5 ml-2">
                                {task.assignees?.slice(0, 3).map((userId, idx) => {
                                  const avatar = getUserAvatar(userId);
                                  return (
                                    <div key={idx} className="w-5 h-5 rounded-full border border-white bg-gray-200 overflow-hidden flex-shrink-0">
                                      {avatar ? (
                                        <img src={avatar.startsWith('http') ? avatar : `http://localhost:8080${avatar}`} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-500">?</div>
                                      )}
                                    </div>
                                  );
                                })}
                                {task.assignees?.length > 3 && (
                                  <div className="w-5 h-5 rounded-full border border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>

                              {duration > 3 && (
                                <span className="text-[10px] text-white/90 font-bold ml-2">
                                  {task.progress}%
                                </span>
                              )}
                            </div>

                            {/* Tooltip on Hover (Simple) */}
                          </div>
                        </div>
                        {expandedTasks[task._id] && task.subtasks && task.subtasks.map(subtask => {
                          const subStart = subtask.startDate || subtask.createdAt;
                          const subEnd = subtask.dueDate || subStart;
                          const subStartPosition = getDayPosition(subStart);
                          const subDuration = getTaskDuration(subStart, subEnd);
                          const parentColor = getStatusColor(task.status);

                          return (
                            <div key={subtask.id} className="flex hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800/50">
                              <div className="w-80 px-4 py-2 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-center bg-gray-50/30 dark:bg-slate-900/50 sticky left-0 z-10 pl-12 shadow-[inset_4px_0_0_0_rgb(243,244,246)]">
                                <div className="flex items-center gap-2 justify-between">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${subtask.completed ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs truncate ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-600 dark:text-gray-300'}`} title={subtask.title}>{subtask.title}</span>
                                  </div>
                                  {(subtask.startDate || subtask.dueDate) && (
                                    <span className="text-[9px] text-gray-400 flex-shrink-0">
                                      {new Date(subtask.startDate || subtask.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 relative h-8 min-w-max">
                                <div className="absolute inset-0 flex h-full">
                                  {timeline.map((date, index) => {
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    return (
                                      <div
                                        key={index}
                                        className={`w-12 border-r border-gray-100/30 dark:border-gray-800/30 h-full ${isToday ? 'bg-blue-50/10' : ''
                                          } ${isWeekend ? 'bg-gray-50/20 dark:bg-gray-800/10' : ''}`}
                                      />
                                    );
                                  })}
                                </div>
                                {subStartPosition >= -5 && subStartPosition <= 50 && (
                                  <div
                                    className={`absolute top-1/2 transform -translate-y-1/2 h-3.5 rounded-sm shadow-sm border border-black/5 flex items-center px-1 z-0 transition-all ${subtask.completed
                                      ? 'opacity-80 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.05),rgba(0,0,0,0.05)_10px,transparent_10px,transparent_20px)] grayscale'
                                      : 'opacity-90 hover:opacity-100 hover:shadow-md'
                                      }`}
                                    style={{
                                      left: `${Math.max(0, subStartPosition * 48)}px`,
                                      width: `${Math.max(24, subDuration * 48)}px`,
                                      backgroundColor: subtask.completed ? '#10b981' : parentColor
                                    }}
                                    title={`${subtask.title}`}
                                  >
                                    {subtask.assignee && (
                                      <div className="w-3.5 h-3.5 rounded-full overflow-hidden border border-white mr-1 flex-shrink-0 shadow-sm">
                                        <img src={users.find(u => u._id === subtask.assignee)?.avatar || ''} className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              ))}

              {boardTasks.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Bu görünümde hiç görev yok.
                </div>
              )}
            </div>
          </div >
        </div >
      </div >

      {/* Task Modal */}
      {
        isModalOpen && selectedTask && (
          <ModernTaskModal
            task={selectedTask}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )
      }
    </>
  );
};

export default GanttView;
