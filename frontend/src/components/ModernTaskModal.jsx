import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Calendar, User as UserIcon, MessageSquare, Paperclip, BarChart3, Clock, Plus, CheckCircle2, ListTodo, Trash2, History } from 'lucide-react';
import { useDataState, useDataActions } from '../contexts/DataContext';
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
  { id: 'low', label: 'Düşük', color: '#eef2f5', textColor: '#5f6b7c' },
  { id: 'medium', label: 'Orta', color: '#e5e9f5', textColor: '#4051b5' },
  { id: 'high', label: 'Yüksek', color: '#fff0e5', textColor: '#ff6b00' },
  { id: 'urgent', label: 'Acil', color: '#ffe5e9', textColor: '#d91d4a' }
];

const ModernTaskModal = ({ task, isOpen, onClose, initialSection = 'subtasks' }) => {
  const { updateTask, updateTaskStatus } = useDataActions();
  const { users, labels: allLabels } = useDataState();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('history');
  const [taskData, setTaskData] = useState(task);
  const [newUpdate, setNewUpdate] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [comments, setComments] = useState(task.comments || []);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);

  // Update active section if modal is re-opened with new initial section
  React.useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
    }
  }, [isOpen, initialSection]);

  if (!isOpen) return null;

  const getStatusData = (statusId) => {
    return statuses.find(s => s.id === statusId) || statuses[0];
  };

  const getPriorityData = (priorityId) => {
    return priorities.find(p => p.id === priorityId) || priorities[0];
  };

  const getAssignees = (assigneeIds) => {
    return users.filter(u => assigneeIds?.includes(u.id || u._id));
  };

  const handleStatusChange = (newStatus) => {
    setTaskData({ ...taskData, status: newStatus });
  };

  const handleTitleUpdate = () => {
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
        userAvatar: currentUser?.avatar,
        createdAt: new Date().toISOString()
      };
      const updatedComments = [...comments, comment];
      setComments(updatedComments);
      setNewComment('');

      // Update local taskData to ensure consistency
      const updatedTaskData = {
        ...taskData,
        comments: updatedComments
      };
      setTaskData(updatedTaskData);

      toast.success('Yorum eklendi');

      // Persist immediately REMOVED - wait for Save button
      // updateTask(taskData._id || taskData.id, updatedTaskData);
    }
  };

  const handleAddSubtask = async () => {
    if (newSubtask.trim()) {
      const subtask = {
        id: Date.now(),
        title: newSubtask,
        completed: false,
        createdAt: new Date().toISOString()
      };
      const newSubtasks = [...subtasks, subtask];
      setSubtasks(newSubtasks);
      setNewSubtask('');

      // Update taskData
      setTaskData({ ...taskData, subtasks: newSubtasks });
    }
  };

  const toggleSubtask = async (subtaskId) => {
    const newSubtasks = subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(newSubtasks);
    setTaskData({ ...taskData, subtasks: newSubtasks });
  };

  const deleteSubtask = async (subtaskId) => {
    const newSubtasks = subtasks.filter(st => st.id !== subtaskId);
    setSubtasks(newSubtasks);
    setTaskData({ ...taskData, subtasks: newSubtasks });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Yükleme başarısız');

      const data = await response.json();

      const newAttachment = {
        id: Date.now(),
        name: data.filename,
        url: `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}${data.url}`,
        type: data.content_type,
        size: data.size,
        uploadedAt: new Date().toISOString()
      };

      const newAttachments = [...attachments, newAttachment];
      setAttachments(newAttachments);
      setTaskData({ ...taskData, attachments: newAttachments });

      // Show toast but don't save task yet
      toast.success('Dosya yüklendi (Kaydetmeyi unutmayın)');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Dosya yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAttachment = async (attachmentId) => {
    const newAttachments = attachments.filter(a => a.id !== attachmentId);
    setAttachments(newAttachments);
    setAttachments(newAttachments);
    toast.success('Dosya listeden kaldırıldı');
  };

  const statusData = getStatusData(taskData.status);
  const priorityData = getPriorityData(taskData.priority);
  const taskAssignees = getAssignees(taskData.assignees);

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center"
      style={{ zIndex: 999999, pointerEvents: 'auto' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl w-full max-w-6xl h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto', zIndex: 1000000 }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
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

            {/* Description Field */}
            <div className="mt-2">
              <Textarea
                value={taskData.description || ''}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                placeholder="Görev açıklaması ekle..."
                className="min-h-[60px] resize-none border-none shadow-none focus:ring-0 p-0 text-gray-600 dark:text-gray-400 text-sm bg-transparent placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                onClose();
                updateTask(task._id, {
                  ...taskData,
                  subtasks,
                  attachments,
                  comments
                });
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 shadow-sm"
            >
              Kaydet
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-600 hover:bg-gray-100 hover:text-gray-800 font-medium"
            >
              Kapat
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Quick Actions */}
          <div className="w-20 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-6 gap-4">

            {/* Subtasks Button */}
            <button
              onClick={() => setActiveSection('subtasks')}
              className={`p-3 hover:bg-white rounded-lg transition-colors ${activeSection === 'subtasks' ? 'bg-white shadow-md' : ''}`}
              title="Alt Görevler"
            >
              <ListTodo size={20} className={activeSection === 'subtasks' ? 'text-[#6366f1]' : 'text-gray-600'} />
            </button>
            <button
              onClick={() => setActiveSection('comments')}
              className={`p-3 hover:bg-white rounded-lg transition-colors relative ${activeSection === 'comments' ? 'bg-white shadow-md' : ''}`}
              title="Yorumlar"
            >
              <MessageSquare size={20} className={activeSection === 'comments' ? 'text-[#6366f1]' : 'text-gray-600'} />
              {comments.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              {comments.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center border-2 border-gray-50">
                  {comments.length}
                </div>
              )}
            </button>
            <button
              onClick={() => setActiveSection('files')}
              className={`p-3 hover:bg-white rounded-lg transition-colors ${activeSection === 'files' ? 'bg-white shadow-md' : ''}`}
              title="Dosyalar"
            >
              <Paperclip size={20} className={activeSection === 'files' ? 'text-[#6366f1]' : 'text-gray-600'} />
            </button>

            <div className="flex-1" />

            {/* History Button - Bottom Aligned */}
            <button
              onClick={() => setActiveSection('activity')}
              className={`p-3 hover:bg-white rounded-lg transition-colors ${activeSection === 'activity' ? 'bg-white shadow-md' : ''}`}
              title="Geçmiş"
            >
              <History size={20} className={activeSection === 'activity' ? 'text-[#6366f1]' : 'text-gray-600'} />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Dynamic Content based on activeSection */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl">

                {/* History/Activity Section - Dedicated View */}
                {activeSection === 'activity' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <History size={20} className="text-[#6366f1]" />
                      Görev Geçmişi
                    </h3>

                    {/* Activity Feed */}
                    <div className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                      <div className="space-y-6">
                        {/* Task Created Entry */}
                        <div className="relative">
                          <div className="absolute -left-[24px] top-1.5 w-4 h-4 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                            <CheckCircle2 size={10} className="text-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">Görev Oluşturuldu</span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(taskData.createdAt).toLocaleString('tr-TR')}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {currentUser?.fullName} tarafından oluşturuldu
                            </p>
                          </div>
                        </div>

                        {/* Comments mapping (Activity) */}
                        {comments.map((comment) => (
                          <div key={comment.id} className="relative">
                            <div className="absolute -left-[24px] top-1.5 w-5 h-5 rounded-full border-2 border-white overflow-hidden">
                              <Avatar className="w-full h-full">
                                <AvatarImage src={comment.userAvatar} />
                                <AvatarFallback className="text-[8px]">{comment.userName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-900">{comment.userName || 'Kullanıcı'}</span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(comment.createdAt).toLocaleString('tr-TR')}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 mt-1 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtasks Section */}
                {activeSection === 'subtasks' && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Alt Görevler</h3>
                    <div className="mb-6">
                      <div className="flex gap-2">
                        <Input
                          value={newSubtask}
                          onChange={(e) => setNewSubtask(e.target.value)}
                          placeholder="Yeni alt görev ekle..."
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleAddSubtask}
                          disabled={!newSubtask.trim()}
                          className="bg-[#6366f1] hover:bg-[#5558e3]"
                        >
                          <Plus size={18} />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(subtask.id)}
                            className="w-5 h-5 rounded border-gray-300 text-[#6366f1] focus:ring-[#6366f1]"
                          />
                          <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {subtask.title}
                          </span>
                          <button
                            onClick={() => deleteSubtask(subtask.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {subtasks.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Henüz alt görev eklenmedi</p>
                      )}
                    </div>
                  </>
                )}

                {/* Comments Section */}
                {activeSection === 'comments' && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Yorumlar</h3>
                    <div className="mb-6">
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={currentUser?.avatar} />
                          <AvatarFallback>{currentUser?.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Yorum yaz..."
                            className="min-h-[80px] resize-none border-2 focus:border-[#0086c0]"
                          />
                          <div className="mt-2">
                            <Button
                              onClick={handleAddComment}
                              disabled={!newComment.trim()}
                              className="bg-[#0086c0] hover:bg-[#006a99]"
                              size="sm"
                            >
                              Yorum Ekle
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900">{comment.userName || 'Kullanıcı'}</span>
                                <span className="text-sm text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{comment.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Henüz yorum yapılmadı</p>
                      )}
                    </div>
                  </>
                )}

                {/* Files Section */}
                {activeSection === 'files' && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dosyalar</h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {attachments.map((file) => (
                        <div key={file.id} className="relative group bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <button
                            onClick={() => deleteAttachment(file.id)}
                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                          >
                            <X size={14} />
                          </button>

                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                              {file.type?.includes('image') ? '🖼️' : '📄'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate" title={file.name}>{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                            </div>
                          </a>
                        </div>
                      ))}
                    </div>

                    <label className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#6366f1] transition-colors cursor-pointer block ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <Paperclip size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-2">
                        {isUploading ? 'Yükleniyor...' : 'Dosya yüklemek için tıklayın veya sürükleyin'}
                      </p>
                      <p className="text-sm text-gray-500">PDF, JPG, PNG, DOC (Max 10MB)</p>
                    </label>
                  </>
                )}



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
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${taskData.status === status.id
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
                      <option
                        key={priority.id}
                        value={priority.id}
                        style={{
                          backgroundColor: priority.color,
                          color: priority.textColor
                        }}
                      >
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
                        <button
                          onClick={async () => {
                            const newAssignees = (taskData.assignees || []).filter(id => id !== assignee._id);
                            setTaskData({ ...taskData, assignees: newAssignees });
                          }}
                          className="ml-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    {/* Add Assignee Dropdown */}
                    <div className="relative group">
                      <button className="flex items-center gap-1 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0086c0] transition-colors text-sm">
                        <Plus size={16} />
                        <span>Ekle</span>
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 hidden group-hover:block before:block before:absolute before:-top-4 before:left-0 before:w-full before:h-4 before:content-['']">
                        <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                          {users
                            .filter(u => !(taskData.assignees || []).includes(u._id))
                            .map(user => (
                              <button
                                key={user._id}
                                onClick={() => {
                                  const newAssignees = [...(taskData.assignees || []), user._id];
                                  setTaskData({ ...taskData, assignees: newAssignees });
                                }}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-sm flex items-center gap-2"
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {user.fullName}
                              </button>
                            ))}
                          {users.filter(u => !(taskData.assignees || []).includes(u._id)).length === 0 && (
                            <p className="text-xs text-gray-500 p-2 text-center">Kullanıcı bulunamadı</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                    Etiketler
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {/* Display existing labels */}
                    {allLabels
                      .filter(l => taskData.labels?.includes(l.id) || taskData.tags?.includes(l.id))
                      .map(label => (
                        <div
                          key={label.id}
                          className="px-2 py-1 rounded text-xs text-white flex items-center gap-1"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                          <button
                            onClick={() => {
                              const newLabels = (taskData.labels || []).filter(id => id !== label.id);
                              setTaskData({ ...taskData, labels: newLabels });
                            }}
                            className="hover:text-gray-200"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                    {/* Add Label Dropdown */}
                    <div className="relative group">
                      <button className="flex items-center gap-1 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0086c0] transition-colors text-sm">
                        <Plus size={16} />
                        <span>Ekle</span>
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 hidden group-hover:block before:block before:absolute before:-top-4 before:left-0 before:w-full before:h-4 before:content-['']">
                        <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                          {allLabels
                            .filter(l => l.projectId === task.projectId && !(taskData.labels?.includes(l.id) || taskData.tags?.includes(l.id)))
                            .map(label => (
                              <button
                                key={label.id}
                                onClick={() => {
                                  const newLabels = [...(taskData.labels || []), label.id];
                                  setTaskData({ ...taskData, labels: newLabels });
                                }}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-sm flex items-center gap-2"
                              >
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                                {label.name}
                              </button>
                            ))}
                          {allLabels.filter(l => l.projectId === task.projectId).length === 0 && (
                            <p className="text-xs text-gray-500 p-2 text-center">Etiket bulunamadı</p>
                          )}
                        </div>
                      </div>
                    </div>
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
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setTaskData({ ...taskData, dueDate: newDate });
                    }}
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
                      className="w-full cursor-pointer accent-[#0086c0]"
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

  // Use React Portal to render modal at body level
  return ReactDOM.createPortal(modalContent, document.body);
};

export default ModernTaskModal;
