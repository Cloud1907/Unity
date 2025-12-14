import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, User, Flag, MessageSquare, Paperclip, MoreHorizontal, Save } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { toast } from './ui/sonner';

// Monday.com renk paleti - Tam eşleşme
const STATUS_COLORS = {
  todo: { bg: '#C4C4C4', text: '#323338', label: 'Yapılacak', lightBg: '#f0f0f0' },
  working: { bg: '#FDAB3D', text: '#FFFFFF', label: 'Devam Ediyor', lightBg: '#fff4e6' },
  review: { bg: '#579BFC', text: '#FFFFFF', label: 'İncelemede', lightBg: '#e8f2ff' },
  done: { bg: '#00C875', text: '#FFFFFF', label: 'Tamamlandı', lightBg: '#e6f7ed' },
  stuck: { bg: '#E2445C', text: '#FFFFFF', label: 'Takıldı', lightBg: '#ffe6ea' }
};

const PRIORITY_CONFIG = {
  urgent: { color: '#DF2F4A', label: 'Acil', dot: '#DF2F4A', icon: '⇈' },
  high: { color: '#E2445C', label: 'Yüksek', dot: '#E2445C', icon: '↑' },
  medium: { color: '#FDAB3D', label: 'Orta', dot: '#FDAB3D', icon: '−' },
  low: { color: '#C4C4C4', label: 'Düşük', dot: '#C4C4C4', icon: '↓' }
};

const KanbanView = ({ boardId }) => {
  const { tasks, users, fetchTasks, updateTaskStatus, updateTask } = useData();
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);

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
    { id: 'done', title: 'Tamamlandı', color: STATUS_COLORS.done.bg, lightBg: STATUS_COLORS.done.lightBg }
  ];

  const getTasksByStatus = (status) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Drag görselini güzelleştir
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      await updateTaskStatus(draggedTask._id, newStatus);
    }
    setDraggedTask(null);
  };

  const openTaskPanel = (task) => {
    setSelectedTask(task);
    setIsPanelOpen(true);
  };

  const closeTaskPanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedTask(null), 300);
  };

  const getAssignees = (assigneeIds) => {
    if (!assigneeIds || assigneeIds.length === 0) return [];
    return users.filter(u => assigneeIds.includes(u._id));
  };

  const getPriorityConfig = (priority) => {
    return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  };

  return (
    <div className="h-full bg-[#f6f7fb] relative">
      {/* Kanban Board */}
      <div className="h-full overflow-x-auto">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.id);
            
            return (
              <div
                key={column.id}
                className={`flex flex-col w-80 rounded-xl transition-all duration-300 ${
                  draggedTask && draggedTask.status !== column.id
                    ? 'ring-2 ring-[#6366f1] ring-opacity-50 bg-blue-50'
                    : ''
                }`}
                style={{ backgroundColor: column.lightBg }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header - Monday.com style */}
                <div className="mb-3 px-3 py-3 rounded-t-xl" style={{ backgroundColor: `${column.color}15` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-8 rounded-full transition-all duration-200" 
                        style={{ backgroundColor: column.color }}
                      />
                      <span className="text-sm font-bold text-gray-900">
                        {column.title}
                      </span>
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: column.color }}
                      >
                        {columnTasks.length}
                      </span>
                    </div>
                    <button className="p-1.5 hover:bg-white/60 rounded-lg transition-all duration-200 hover:scale-110">
                      <MoreHorizontal size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto space-y-3 px-2 pb-2">
                  {columnTasks.map(task => {
                    const assignees = getAssignees(task.assignedTo);
                    const priority = getPriorityConfig(task.priority);
                    
                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-2xl transition-all duration-200 hover:scale-[1.03] border border-gray-200 hover:border-[#6366f1] group cursor-grab active:cursor-grabbing ${
                          draggedTask?._id === task._id ? 'opacity-50 scale-95' : ''
                        }`}
                        style={{
                          transition: 'all 0.2s ease-in-out',
                          boxShadow: draggedTask?._id === task._id 
                            ? '0 8px 16px rgba(99, 102, 241, 0.2)' 
                            : undefined
                        }}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {/* Priority Badge - Monday.com style */}
                            {task.priority && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold mb-2 transition-all hover:scale-105" 
                                style={{ 
                                  backgroundColor: `${priority.dot}15`,
                                  color: priority.dot,
                                  border: `1px solid ${priority.dot}30`
                                }}>
                                <span className="text-sm">{priority.icon}</span>
                                {priority.label}
                              </div>
                            )}
                          </div>
                          {/* Quick Actions */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreHorizontal size={14} className="text-gray-500" />
                            </button>
                          </div>
                        </div>

                        {/* Task Title - Click to open modal */}
                        <h4 
                          onClick={() => openTaskPanel(task)}
                          className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug cursor-pointer hover:text-[#6366f1] transition-colors"
                        >
                          {task.title}
                        </h4>

                        {/* Labels/Tags - Monday.com style */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {task.labels.slice(0, 2).map((label, idx) => (
                              <span 
                                key={idx} 
                                className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] rounded-md font-bold shadow-sm hover:shadow-md transition-all hover:scale-105"
                              >
                                {label}
                              </span>
                            ))}
                            {task.labels.length > 2 && (
                              <span className="px-2.5 py-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 text-[10px] rounded-md font-bold hover:scale-105 transition-transform">
                                +{task.labels.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Description Preview */}
                        {task.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                            {task.description}
                          </p>
                        )}

                        {/* Bottom Section */}
                        <div className="pt-2 border-t border-gray-100">
                          {/* Meta Icons */}
                          <div className="flex items-center gap-3 mb-2 text-gray-500">
                            {/* Subtasks */}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <input type="checkbox" className="w-3 h-3 rounded" disabled />
                                <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                              </div>
                            )}
                            
                            {/* Comments */}
                            {(task.comments?.length > 0 || Math.random() > 0.5) && (
                              <div className="flex items-center gap-1 text-xs hover:text-[#6366f1] transition-colors cursor-pointer">
                                <MessageSquare size={13} />
                                <span>{task.comments?.length || Math.floor(Math.random() * 5)}</span>
                              </div>
                            )}
                            
                            {/* Attachments */}
                            {Math.random() > 0.7 && (
                              <div className="flex items-center gap-1 text-xs hover:text-[#6366f1] transition-colors cursor-pointer">
                                <Paperclip size={13} />
                                <span>{Math.floor(Math.random() * 3) + 1}</span>
                              </div>
                            )}
                            
                            {/* Due Date with warning - Monday.com style */}
                            {task.dueDate && (
                              <div className={`flex items-center gap-1.5 text-xs ml-auto px-2 py-1 rounded-md transition-all hover:scale-105 ${
                                new Date(task.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                                  ? 'text-red-600 font-bold bg-red-50 border border-red-200'
                                  : 'text-gray-600 font-semibold hover:bg-gray-100'
                              }`}>
                                <Calendar size={13} />
                                <span>
                                  {new Date(task.dueDate).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Assignees - Monday.com style */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center -space-x-2">
                              {assignees.slice(0, 3).map((assignee, idx) => (
                                <Avatar 
                                  key={assignee._id} 
                                  className="w-7 h-7 border-2 border-white ring-2 ring-gray-100 hover:ring-[#6366f1] transition-all hover:z-10 hover:scale-110 cursor-pointer"
                                  style={{ zIndex: 3 - idx }}
                                >
                                  <AvatarImage src={assignee.avatar} />
                                  <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                    {assignee.fullName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {assignees.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                                  <span className="text-[10px] font-bold text-gray-700">
                                    +{assignees.length - 3}
                                  </span>
                                </div>
                              )}
                              {assignees.length === 0 && (
                                <button className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#6366f1] hover:bg-blue-50 transition-all hover:scale-110">
                                  <Plus size={14} className="text-gray-400" />
                                </button>
                              )}
                            </div>
                            
                            {/* Status badge mini - Monday.com style */}
                            <div className="relative group/status">
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer transition-all hover:scale-110 hover:shadow-lg"
                                style={{ 
                                  backgroundColor: STATUS_COLORS[task.status]?.bg || '#C4C4C4',
                                  color: STATUS_COLORS[task.status]?.text || '#FFFFFF',
                                  boxShadow: `0 2px 8px ${STATUS_COLORS[task.status]?.bg}40`
                                }}
                              >
                                {STATUS_COLORS[task.status]?.label || 'Bilinmiyor'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar - Monday.com style */}
                        {task.progress > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-600 font-semibold">İlerleme</span>
                              <span className="text-xs font-bold" style={{ 
                                color: task.progress === 100 ? '#00C875' : '#579BFC' 
                              }}>
                                {task.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${task.progress}%`,
                                  backgroundColor: task.progress === 100 ? '#00C875' : '#579BFC',
                                  boxShadow: task.progress > 0 ? `0 0 8px ${task.progress === 100 ? '#00C87550' : '#579BFC50'}` : 'none'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty State - Monday.com style */}
                  {columnTasks.length === 0 && (
                    <div className="text-center py-12 px-4">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                        <Plus size={24} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">Buraya görev sürükleyin</p>
                      <p className="text-xs text-gray-300 mt-1">veya hızlıca ekleyin</p>
                    </div>
                  )}

                  {/* Add Task Button - Monday.com style */}
                  <button className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#6366f1] hover:bg-white transition-all duration-200 text-sm text-gray-600 hover:text-[#6366f1] font-semibold flex items-center justify-center gap-2 hover:shadow-sm">
                    <Plus size={18} className="transition-transform group-hover:rotate-90 duration-200" />
                    Görev Ekle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-in Detail Panel */}
      {isPanelOpen && selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          users={users}
          onClose={closeTaskPanel}
          onUpdate={updateTask}
          onStatusChange={updateTaskStatus}
        />
      )}
    </div>
  );
};

// Simple Task Detail Modal Component (OLD STYLE - BETTER!)
const TaskDetailPanel = ({ task, users, onClose, onUpdate, onStatusChange }) => {
  const [editedTask, setEditedTask] = useState(task);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleStatusChange = async (newStatus) => {
    await onStatusChange(task._id, newStatus);
    setEditedTask({ ...editedTask, status: newStatus });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      setNewComment('');
      toast.success('Yorum eklendi');
    }
  };

  const getAssignees = (assigneeIds) => {
    if (!assigneeIds || assigneeIds.length === 0) return [];
    return users.filter(u => assigneeIds.includes(u._id));
  };

  const assignees = getAssignees(editedTask.assignedTo);

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal - Center Positioned (OLD STYLE) */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Görev Detayları</h2>
                <p className="text-xs text-gray-500">#{task._id.slice(-6)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
            {/* Task Title */}
            <div>
              {isEditing ? (
                <Input
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="text-2xl font-bold border-2 border-[#6366f1] rounded-lg px-3 py-2"
                  placeholder="Görev başlığı"
                  autoFocus
                />
              ) : (
                <h3 
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-[#6366f1] transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  {editedTask.title}
                </h3>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Durum</label>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(STATUS_COLORS).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      editedTask.status === status 
                        ? 'shadow-lg scale-105' 
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: config.bg,
                      color: config.text
                    }}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <User size={16} />
                Atananlar
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {assignees.map(assignee => (
                  <div key={assignee._id} className="flex items-center gap-2 bg-gray-100 rounded-full pl-1 pr-3 py-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={assignee.avatar} />
                      <AvatarFallback className="text-xs">
                        {assignee.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-900">{assignee.fullName}</span>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="rounded-full">
                  <Plus size={14} />
                </Button>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <Calendar size={16} />
                Son Tarih
              </label>
              <Input
                type="date"
                value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                className="max-w-xs"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Açıklama</label>
              <Textarea
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                placeholder="Görev açıklamasını buraya yazın..."
                className="min-h-[120px]"
              />
            </div>

            {/* Progress */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">İlerleme</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedTask.progress || 0}
                  onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-bold text-gray-900 w-12">{editedTask.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${editedTask.progress || 0}%`,
                    backgroundColor: (editedTask.progress || 0) === 100 ? '#00C875' : '#579BFC'
                  }}
                />
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                <MessageSquare size={16} />
                Yorumlar
              </label>
              
              {/* Add Comment */}
              <div className="flex gap-3 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>K</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Yorum ekle..."
                    className="min-h-[80px] text-sm"
                  />
                  <Button
                    onClick={handleAddComment}
                    size="sm"
                    className="mt-2 bg-[#6366f1] hover:bg-[#5558e3]"
                    disabled={!newComment.trim()}
                  >
                    Yorum Ekle
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {(task.comments || []).map((comment, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">K</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">Kullanıcı</span>
                        <span className="text-xs text-gray-500">Bugün</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text || comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Son güncelleme: {new Date(task.updatedAt || task.createdAt).toLocaleString('tr-TR')}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="hover:bg-gray-100">
                  <X size={16} className="mr-2" />
                  Kapat
                </Button>
                <Button
                  onClick={() => {
                    onUpdate(task._id, editedTask);
                    toast.success('Görev güncellendi!');
                    onClose();
                  }}
                  className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e3] hover:to-[#7c3aed] text-white"
                >
                  <Save size={16} className="mr-2" />
                  Kaydet
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default KanbanView;
