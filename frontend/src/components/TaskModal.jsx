import React, { useState } from 'react';
import { X, Calendar, User, Tag, TrendingUp, MessageSquare, Paperclip, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

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

const TaskModal = ({ task, isOpen, onClose }) => {
  const { users } = useData();
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');

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

  const getCommentUser = (userId) => {
    return users.find(u => u._id === userId);
  };

  const statusData = getStatusData(task.status);
  const priorityData = getPriorityData(task.priority);
  const taskAssignees = getAssignees(task.assignees);
  const taskLabels = task.labels || [];

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Mock comment addition
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <input
              type="text"
              defaultValue={task.title}
              className="text-2xl font-bold text-gray-900 border-none outline-none w-full focus:ring-2 focus:ring-[#0086c0] rounded px-2 py-1"
            />
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex h-[calc(90vh-100px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-3 px-1 font-medium transition-all ${
                  activeTab === 'details'
                    ? 'text-[#0086c0] border-b-2 border-[#0086c0]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Detaylar
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-3 px-1 font-medium transition-all ${
                  activeTab === 'comments'
                    ? 'text-[#0086c0] border-b-2 border-[#0086c0]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yorumlar ({(task.comments || []).length})
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`pb-3 px-1 font-medium transition-all ${
                  activeTab === 'files'
                    ? 'text-[#0086c0] border-b-2 border-[#0086c0]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dosyalar ({task.files.length})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <Textarea
                    defaultValue={task.description}
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alt Görevler
                  </label>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span>+</span> Alt Görev Ekle
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Comment Input */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={users[0].avatar} />
                    <AvatarFallback>{users[0].name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Yorum ekle..."
                      rows={3}
                      className="w-full resize-none mb-2"
                    />
                    <Button size="sm" onClick={handleAddComment}>
                      Yorum Ekle
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4 mt-6">
                  {(task.comments || []).map(comment => {
                    const commentUser = getCommentUser(comment.userId);
                    return (
                      <div key={comment._id || comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={commentUser?.avatar} />
                          <AvatarFallback>{commentUser?.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{commentUser?.fullName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#0086c0] transition-colors cursor-pointer">
                  <Paperclip size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">Dosya yüklemek için tıklayın veya sürükleyin</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-gray-50 p-6 overflow-y-auto border-l border-gray-200">
            <div className="space-y-6">
              {/* Status */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusData.color }}></div>
                  Durum
                </label>
                <select
                  defaultValue={task.status}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0086c0]"
                >
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <TrendingUp size={14} />
                  Öncelik
                </label>
                <select
                  defaultValue={task.priority}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0086c0]"
                >
                  {priorities.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.icon} {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignees */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User size={14} />
                  Atanan Kişiler
                </label>
                <div className="flex flex-wrap gap-2">
                  {taskAssignees.map(assignee => (
                    <div key={assignee.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={assignee.avatar} />
                        <AvatarFallback style={{ backgroundColor: assignee.color }}>
                          {assignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignee.name}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm">+ Ekle</Button>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Calendar size={14} />
                  Son Tarih
                </label>
                <input
                  type="date"
                  defaultValue={task.dueDate}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0086c0]"
                />
              </div>

              {/* Labels */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Tag size={14} />
                  Etiketler
                </label>
                <div className="flex flex-wrap gap-2">
                  {taskLabels.map(label => (
                    <span
                      key={label.id}
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                  <Button variant="outline" size="sm">+ Ekle</Button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Clock size={14} />
                  İlerleme
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={task.progress}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0%</span>
                    <span className="font-semibold">{task.progress}%</span>
                    <span>100%</span>
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

export default TaskModal;
