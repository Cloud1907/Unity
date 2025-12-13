import React, { useState } from 'react';
import { X, Calendar, User as UserIcon, MessageSquare, Paperclip, BarChart3, Clock, Plus, CheckCircle2, ListTodo, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { toast } from './ui/sonner';

const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#c4c4c4' },
  { id: 'working', label: 'Devam Ediyor', color: '#fdab3d' },
  { id: 'stuck', label: 'Takıldı', color: '#e2445c' },
  { id: 'done', label: 'Tamamlandı', color: '#00c875' },
  { id: 'review', label: 'İncelemede', color: '#579bfc' }
];

const priorities = [
  { id: 'low', label: 'Düşük', color: '#c4c4c4' },
  { id: 'medium', label: 'Orta', color: '#fdab3d' },
  { id: 'high', label: 'Yüksek', color: '#e2445c' },
  { id: 'urgent', label: 'Acil', color: '#df2f4a' }
];

const ModernTaskModal = ({ task, isOpen, onClose }) => {
  const { users, updateTask, updateTaskStatus } = useData();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('updates');
  const [taskData, setTaskData] = useState(task);
  const [newUpdate, setNewUpdate] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [comments, setComments] = useState(task.comments || []);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('activity');

  if (!isOpen) return null;

  const getStatusData = (statusId) => {
    return statuses.find(s => s.id === statusId) || statuses[0];
  };

  const getPriorityData = (priorityId) => {
    return priorities.find(p => p.id === priorityId) || priorities[0];
  };

  const getAssignees = (assigneeIds) => {
    return users.filter(u => assigneeIds?.includes(u._id));
  };

  const handleStatusChange = async (newStatus) => {
    const result = await updateTaskStatus(task._id, newStatus);
    if (result.success) {
      setTaskData({ ...taskData, status: newStatus });
    }
  };

  const handleTitleUpdate = async () => {
    if (taskData.title !== task.title) {
      const result = await updateTask(task._id, { title: taskData.title });
      if (result.success) {
        toast.success('Başlık güncellendi');
      }
    }
    setIsEditing(false);
  };

  const handleAddUpdate = () => {
    if (newUpdate.trim()) {
      toast.success('Güncelleme eklendi');
      setNewUpdate('');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        text: newComment,
        userId: currentUser?._id,
        userName: currentUser?.fullName,
        createdAt: new Date().toISOString()
      };
      setComments([...comments, comment]);
      setNewComment('');
      toast.success('Yorum eklendi');
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const subtask = {
        id: Date.now(),
        title: newSubtask,
        completed: false,
        createdAt: new Date().toISOString()
      };
      setSubtasks([...subtasks, subtask]);
      setNewSubtask('');
      toast.success('Alt görev eklendi');
    }
  };

  const toggleSubtask = (subtaskId) => {
    setSubtasks(subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    ));
  };

  const deleteSubtask = (subtaskId) => {
    setSubtasks(subtasks.filter(st => st.id !== subtaskId));
    toast.success('Alt görev silindi');
  };

  const statusData = getStatusData(taskData.status);
  const priorityData = getPriorityData(taskData.priority);
  const taskAssignees = getAssignees(taskData.assignees);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center" 
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl w-full max-w-6xl h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                onBlur={handleTitleUpdate}
                onKeyPress={(e) => e.key === 'Enter' && handleTitleUpdate()}
                className="text-2xl font-semibold border-none shadow-none focus:ring-2 focus:ring-[#0086c0] px-0"
                autoFocus
              />
            ) : (
              <h2 
                className="text-2xl font-semibold text-gray-900 cursor-pointer hover:text-[#0086c0] transition-colors"
                onClick={() => setIsEditing(true)}
              >
                {taskData.title}
              </h2>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Sidebar - Quick Actions */}
          <div className="w-20 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-6 gap-4">
            <button className="p-3 hover:bg-white rounded-lg transition-colors" title="Durum">
              <CheckCircle2 size={20} className="text-gray-600" />
            </button>
            <button className="p-3 hover:bg-white rounded-lg transition-colors" title="Öncelik">
              <BarChart3 size={20} className="text-gray-600" />
            </button>
            <button className="p-3 hover:bg-white rounded-lg transition-colors" title="Atananlar">
              <User size={20} className="text-gray-600" />
            </button>
            <button className="p-3 hover:bg-white rounded-lg transition-colors" title="Tarih">
              <Calendar size={20} className="text-gray-600" />
            </button>
            <button className="p-3 hover:bg-white rounded-lg transition-colors" title="Dosyalar">
              <Paperclip size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* Updates / Activity Feed */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl">
                {/* Add Update Section */}
                <div className="mb-8">
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={currentUser?.avatar} />
                      <AvatarFallback>{currentUser?.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        value={newUpdate}
                        onChange={(e) => setNewUpdate(e.target.value)}
                        placeholder="Güncelleme yaz..."
                        className="min-h-[100px] resize-none border-2 focus:border-[#0086c0]"
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <Button 
                          onClick={handleAddUpdate}
                          disabled={!newUpdate.trim()}
                          className="bg-[#0086c0] hover:bg-[#006a99]"
                        >
                          Güncelle
                        </Button>
                        <Button variant="ghost" className="text-gray-600">
                          <Paperclip size={18} className="mr-2" />
                          Dosya Ekle
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle2 size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">Görev Oluşturuldu</span>
                          <span className="text-sm text-gray-500">
                            {new Date(taskData.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {currentUser?.fullName} görevi oluşturdu
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {(taskData.comments || []).map((comment, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">Kullanıcı</span>
                            <span className="text-sm text-gray-500">Bugün</span>
                          </div>
                          <p className="text-sm text-gray-600">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Durum
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map(status => (
                      <button
                        key={status.id}
                        onClick={() => handleStatusChange(status.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          taskData.status === status.id
                            ? 'ring-2 ring-offset-2'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: status.color,
                          color: 'white',
                          ringColor: status.color
                        }}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Öncelik
                  </label>
                  <select
                    value={taskData.priority}
                    onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0086c0]"
                  >
                    {priorities.map(priority => (
                      <option key={priority.id} value={priority.id}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignees */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Atananlar
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {taskAssignees.map(assignee => (
                      <div key={assignee._id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={assignee.avatar} />
                          <AvatarFallback>{assignee.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{assignee.fullName}</span>
                      </div>
                    ))}
                    <button className="flex items-center gap-1 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0086c0] transition-colors">
                      <Plus size={16} />
                      <span className="text-sm">Ekle</span>
                    </button>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Son Tarih
                  </label>
                  <Input
                    type="date"
                    value={taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                    className="w-full"
                  />
                </div>

                {/* Progress */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    İlerleme
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tamamlanma</span>
                      <span className="font-semibold">{taskData.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500 bg-[#0086c0]"
                        style={{ width: `${taskData.progress || 0}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={taskData.progress || 0}
                      onChange={(e) => setTaskData({ ...taskData, progress: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernTaskModal;
