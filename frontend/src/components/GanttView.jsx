import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import ModernTaskModal from './ModernTaskModal';
import { User, Calendar, Layers, ChevronDown, ChevronRight, Download, MessageSquare, Paperclip } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

// Minimalist 2-color scheme
const getStatusColor = (statusId) => {
  if (statusId === 'done') {
    return '#86efac'; // Soft Green (completed)
  }
  return '#cbd5e1'; // Soft Gray (not completed)
};

const GanttView = ({ boardId }) => {
  const { tasks, fetchTasks, users, projects } = useData();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupBy, setGroupBy] = useState('none');
  const [expandedTasks, setExpandedTasks] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const ganttRef = useRef(null);

  // Date range: default -5 days to +60 days from today
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 5);
    const end = new Date(today);
    end.setDate(today.getDate() + 60);
    return { start, end };
  });

  const toggleSubtasks = (taskId) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  React.useEffect(() => {
    if (boardId) {
      fetchTasks(boardId);
    }
  }, [boardId]);

  const boardTasks = useMemo(() =>
    tasks.filter(t => t.projectId === Number(boardId)),
    [tasks, boardId]);

  React.useEffect(() => {
    if (boardTasks.length > 0) {
      const newExpanded = {};
      boardTasks.forEach(task => {
        if (task.subtasks && task.subtasks.length > 0) {
          newExpanded[task._id] = true;
        }
      });
      setExpandedTasks(prev => ({ ...prev, ...newExpanded }));
    }
  }, [boardTasks]);

  // Generate timeline based on date range
  const timeline = useMemo(() => {
    const days = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= diffDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  }, [dateRange]);

  const timelineStart = timeline[0];

  const getDayPosition = (dateString) => {
    if (!dateString) return 0;
    const taskDate = new Date(dateString);
    const diffTime = taskDate - timelineStart;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(-5, Math.min(diffDays, timeline.length + 5));
  };

  const getTaskDuration = (createdAt, dueDate) => {
    const start = new Date(createdAt);
    const end = dueDate ? new Date(dueDate) : new Date(start.getTime() + 86400000);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = ganttRef.current;
      const project = projects?.find(p => p._id === Number(boardId) || p.id === Number(boardId));
      const projectName = project?.name || 'Gantt Chart';
      const dateRangeText = `${dateRange.start.toLocaleDateString('tr-TR')} - ${dateRange.end.toLocaleDateString('tr-TR')}`;

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header
      pdf.setFontSize(14);
      pdf.setTextColor(51, 51, 51);
      pdf.text(projectName, 10, 15);
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(dateRangeText, 10, 21);

      // Add chart with pagination
      let yPosition = 28;
      let remainingHeight = imgHeight;
      const maxHeightPerPage = pdfHeight - 35;
      const imgData = canvas.toDataURL('image/png');

      if (remainingHeight > maxHeightPerPage) {
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, maxHeightPerPage, undefined, 'FAST');
        remainingHeight -= maxHeightPerPage;

        while (remainingHeight > 0) {
          pdf.addPage();
          const heightToDraw = Math.min(remainingHeight, pdfHeight - 10);
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, heightToDraw, undefined, 'FAST');
          remainingHeight -= heightToDraw;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight, undefined, 'FAST');
      }

      pdf.save(`${projectName.replace(/\s+/g, '_')}_Gantt_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF başarıyla indirildi');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF oluştururken hata oluştu');
    } finally {
      setIsExporting(false);
    }
  };

  const groupedTasks = useMemo(() => {
    if (groupBy === 'user') {
      const groups = {};
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
          const userId = task.assignees[0];
          if (!groups[userId]) {
            const user = users.find(u => u._id === userId || u.id === userId);
            groups[userId] = {
              id: userId,
              name: user?.fullName || 'Bilinmeyen',
              avatar: user?.avatar,
              tasks: []
            };
          }
          groups[userId].tasks.push(task);
        }
      });

      return Object.values(groups).filter(g => g.tasks.length > 0);
    }
    return [{ id: 'all', name: 'Tüm Görevler', tasks: boardTasks }];
  }, [boardTasks, groupBy, users]);

  const getUser = (userId) => {
    if (!userId && userId !== 0) return null;
    const id = Number(userId);
    return users.find(u => (u._id && Number(u._id) === id) || (u.id && Number(u.id) === id));
  };

  const getUserAvatar = (userId) => {
    const user = getUser(userId);
    return user?.avatar;
  };

  const getUserName = (userId) => {
    const user = getUser(userId);
    return user?.fullName || 'Bilinmeyen Kullanıcı';
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-[#0f172a]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          {/* Left: View Controls */}
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

          {/* Right: Legend | Date | PDF */}
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                Devam Ediyor
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-300"></span>
                Tamamlandı
              </div>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 text-sm border-l border-gray-200 dark:border-gray-700 pl-4">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800"
              />
            </div>

            {/* PDF Export */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Download size={14} />
              {isExporting ? 'İndiriliyor...' : 'PDF İndir'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto" ref={ganttRef}>
          <div className="min-w-max">
            {/* Timeline Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700 z-20 shadow-sm">
              {/* Months */}
              <div className="flex border-b border-gray-100 dark:border-gray-800">
                <div className="w-80 shrink-0 px-4 py-2 font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                  Zaman Çizelgesi
                </div>
                {(() => {
                  const months = [];
                  let currentMonth = null;
                  let currentCount = 0;

                  timeline.forEach((date) => {
                    const monthKey = date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
                    if (monthKey !== currentMonth) {
                      if (currentMonth) {
                        months.push({ name: currentMonth, count: currentCount });
                      }
                      currentMonth = monthKey;
                      currentCount = 1;
                    } else {
                      currentCount++;
                    }
                  });
                  if (currentMonth) months.push({ name: currentMonth, count: currentCount });

                  return months.map((m, i) => (
                    <div
                      key={i}
                      className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 text-center bg-gray-50/30 dark:bg-slate-800/20"
                      style={{ width: `${m.count * 48}px` }}
                    >
                      {m.name}
                    </div>
                  ));
                })()}
              </div>

              {/* Days */}
              <div className="flex h-8">
                <div className="w-80 shrink-0 border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50" />
                {timeline.map((date, index) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={index}
                      className={`w-12 shrink-0 flex flex-col items-center justify-center border-r border-gray-50 dark:border-gray-800/50 ${isToday ? 'bg-red-50/50 dark:bg-red-900/10' : ''} ${isWeekend ? 'bg-gray-50/50 dark:bg-slate-800/30' : ''}`}
                    >
                      <div className={`text-[9px] leading-none mb-0.5 ${isToday ? 'text-red-600 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                        {date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                      </div>
                      <div className={`text-xs leading-none font-bold ${isToday ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gantt Body */}
            <div>
              {groupedTasks.map((group) => (
                <React.Fragment key={group.id}>
                  {groupBy !== 'none' && (
                    <div className="sticky left-0 right-0 px-4 py-2 bg-gray-100 dark:bg-slate-800/90 border-b border-gray-200 dark:border-gray-700 font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2 backdrop-blur z-10 shadow-sm">
                      {group.avatar && (
                        <img src={group.avatar.startsWith('http') ? group.avatar : `http://localhost:8080${group.avatar}`} className="w-5 h-5 rounded-full" alt="" />
                      )}
                      {group.name}
                      <span className="text-xs font-normal text-gray-500 ml-2">({group.tasks.length} Görev)</span>
                    </div>
                  )}

                  {group.tasks.map(task => {
                    const startProp = task.startDate || task.createdAt;
                    const startPosition = getDayPosition(startProp);
                    const duration = getTaskDuration(startProp, task.dueDate);
                    const assigneeAvatar = task.assignees && task.assignees.length > 0 ? getUserAvatar(task.assignees[0]) : null;
                    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                    const isExpanded = expandedTasks[task._id];

                    return (
                      <React.Fragment key={task._id}>
                        <div className="flex hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors border-b border-gray-100 dark:border-gray-800/50 h-12 relative">
                          <div className="w-80 shrink-0 px-4 border-r border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-slate-900 sticky left-0 z-10">
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                              {hasSubtasks && (
                                <button
                                  onClick={() => toggleSubtasks(task._id)}
                                  className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                              )}
                              <span
                                className="text-sm text-gray-900 dark:text-gray-200 truncate cursor-pointer hover:text-indigo-600"
                                onClick={() => openTaskModal(task)}
                                title={task.title}
                              >
                                {task.title}
                              </span>
                              {/* Indicators */}
                              <div className="flex items-center gap-2 ml-auto shrink-0 pl-2">
                                {/* Comments */}
                                {(() => {
                                  const cCount = (typeof task.commentsJson === 'string' ? JSON.parse(task.commentsJson || '[]').length : task.comments?.length) || 0;
                                  if (cCount > 0) return (
                                    <div className="flex items-center gap-0.5 text-gray-400" title={`${cCount} yorum`}>
                                      <MessageSquare size={12} />
                                      <span className="text-[10px]">{cCount}</span>
                                    </div>
                                  );
                                })()}
                                {/* Attachments */}
                                {(() => {
                                  const fCount = (typeof task.attachmentsJson === 'string' ? JSON.parse(task.attachmentsJson || '[]').length : task.attachments?.length) || 0;
                                  if (fCount > 0) return (
                                    <div className="flex items-center gap-0.5 text-gray-400" title={`${fCount} dosya`}>
                                      <Paperclip size={12} />
                                      <span className="text-[10px]">{fCount}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 relative h-full min-w-max">
                            {/* Grid */}
                            <div className="absolute inset-0 flex h-full">
                              {timeline.map((date, index) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                return (
                                  <div
                                    key={index}
                                    className={`w-12 shrink-0 border-r border-gray-50 dark:border-gray-800/30 h-full ${isWeekend ? 'bg-gray-100/60 dark:bg-slate-800/60' : ''}`}
                                  />
                                );
                              })}
                            </div>

                            {/* Today Line */}
                            <div
                              className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-600 z-10 pointer-events-none"
                              style={{ left: `${getDayPosition(new Date()) * 48 + 24}px` }}
                            >
                              <div className="absolute -top-1 -left-1 w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                            </div>

                            {/* Task Bar */}
                            {startPosition >= -5 && startPosition <= timeline.length + 5 && (
                              <div
                                onClick={() => openTaskModal(task)}
                                className="group/taskbar absolute top-1/2 transform -translate-y-1/2 h-6 rounded-md cursor-pointer transition-all border border-black/10 flex items-center gap-1 px-2 z-10 shadow-md hover:shadow-xl hover:-translate-y-[60%] hover:z-20"
                                style={{
                                  left: `${Math.max(0, startPosition * 48 + 2)}px`,
                                  width: `${Math.max(28, duration * 48 - 4)}px`,
                                  backgroundColor: getStatusColor(task.status),
                                }}
                              >
                                {task.assignees && task.assignees.length > 0 && (
                                  <img
                                    src={assigneeAvatar ? (assigneeAvatar.startsWith('http') ? assigneeAvatar : `http://localhost:8080${assigneeAvatar}`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignees[0]}`}
                                    alt="Assignee"
                                    title={getUserName(task.assignees[0])}
                                    className="w-5 h-5 rounded-full border border-white/50 shrink-0"
                                  />
                                )}

                                {duration > 2 && (
                                  <span className="text-[10px] font-bold text-white truncate flex-1">
                                    {task.title}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Subtasks */}
                        {isExpanded && task.subtasks && task.subtasks.map((subtask, subIdx) => {
                          const subStart = subtask.startDate || subtask.createdAt;
                          const subEnd = subtask.dueDate || subStart;
                          const subStartPosition = getDayPosition(subStart);
                          const subDuration = getTaskDuration(subStart, subEnd);
                          const isLastSubtask = subIdx === task.subtasks.length - 1;

                          return (
                            <div key={subtask.id} className="flex hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-gray-800/50 h-8 relative bg-slate-50/50 dark:bg-slate-900/30">
                              <div className="w-80 shrink-0 px-4 border-r border-gray-200 dark:border-gray-700 flex items-center sticky left-0 z-10 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm">
                                {/* Connectors */}
                                {!isLastSubtask && (
                                  <div className="absolute left-[26px] top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600" style={{ opacity: 0.4 }}></div>
                                )}
                                {isLastSubtask && (
                                  <div className="absolute left-[26px] top-0 bottom-1/2 w-px bg-gray-300 dark:bg-gray-600" style={{ opacity: 0.4 }}></div>
                                )}
                                <div className="absolute left-[26px] top-1/2 w-3 h-px bg-gray-300 dark:bg-gray-600" style={{ opacity: 0.4 }}></div>

                                <div className="flex items-center gap-2 overflow-hidden w-full pl-8">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${subtask.completed ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                  <span className={`text-xs truncate ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-600 dark:text-gray-400'}`} title={subtask.title}>
                                    {subtask.title}
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1 relative h-full min-w-max bg-slate-50/50 dark:bg-slate-900/30">
                                {/* Grid */}
                                <div className="absolute inset-0 flex h-full">
                                  {timeline.map((date, index) => {
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    return (
                                      <div
                                        key={index}
                                        className={`w-12 shrink-0 border-r border-gray-100 dark:border-gray-800/40 h-full ${isWeekend ? 'bg-gray-50 dark:bg-slate-800/40' : ''}`}
                                      />
                                    );
                                  })}
                                </div>

                                {/* Today line */}
                                <div
                                  className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-600 z-0 pointer-events-none opacity-30"
                                  style={{ left: `${getDayPosition(new Date()) * 48 + 24}px` }}
                                ></div>

                                {subStartPosition >= -5 && subStartPosition <= timeline.length + 5 && (
                                  <div
                                    className="absolute top-1/2 transform -translate-y-1/2 h-1.5 rounded-sm cursor-default flex items-center z-0"
                                    style={{
                                      left: `${Math.max(0, subStartPosition * 48 + 4)}px`,
                                      width: `${Math.max(20, subDuration * 48 - 8)}px`,
                                      backgroundColor: subtask.completed ? '#86efac' : '#cbd5e1',
                                      opacity: 0.7
                                    }}
                                    title={subtask.title}
                                  >
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
          </div>
        </div>
      </div>

      {isModalOpen && selectedTask && (
        <ModernTaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default GanttView;
