import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Calendar, User as UserIcon, MessageSquare, Paperclip, Clock, Plus, CheckCircle2, ListTodo, Trash2, History, ChevronDown, Layout } from 'lucide-react';
import { useDataState, useDataActions } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { toast } from './ui/sonner';

const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#cbd5e1' },      // Slate-300
  { id: 'working', label: 'Devam Ediyor', color: '#f59e0b' }, // Amber-500
  { id: 'stuck', label: 'Takıldı', color: '#ef4444' },        // Red-500
  { id: 'done', label: 'Tamamlandı', color: '#22c55e' },      // Green-500
  { id: 'review', label: 'İncelemede', color: '#3b82f6' }     // Blue-500
];

const priorities = [
  { id: 'low', label: 'Düşük', color: '#f1f5f9', textColor: '#64748b' },
  { id: 'medium', label: 'Orta', color: '#e0f2fe', textColor: '#0369a1' },
  { id: 'high', label: 'Yüksek', color: '#ffedd5', textColor: '#c2410c' },
  { id: 'urgent', label: 'Acil', color: '#fee2e2', textColor: '#b91c1c' }
];

const ModernTaskModal = ({ task, isOpen, onClose, initialSection = 'subtasks' }) => {
  const { updateTask } = useDataActions();
  const { users, labels: allLabels } = useDataState();
  const { user: currentUser } = useAuth();

  const [taskData, setTaskData] = useState(task);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [comments, setComments] = useState(task.comments || []);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [activeSection, setActiveSection] = useState(initialSection);

  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const statusMenuRef = useRef(null);

  useEffect(() => {
    if (isOpen) setActiveSection(initialSection);
  }, [isOpen, initialSection]);

  // Click outside listener for menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, taskData, subtasks, attachments, comments]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateTask(task._id, {
      ...taskData,
      subtasks,
      attachments,
      comments
    });
    // Removed toast here to make it feel snappier, rely on UI optimistically updating or parent closing
    toast.success('Değişiklikler kaydedildi');
    onClose();
  };

  const currentStatus = statuses.find(s => s.id === taskData.status) || statuses[0];

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask = {
      id: Date.now(),
      title: newSubtask,
      completed: false,
      createdAt: new Date().toISOString()
    };
    const newSubtasks = [...subtasks, subtask];
    setSubtasks(newSubtasks);
    setTaskData(prev => ({ ...prev, subtasks: newSubtasks }));
    setNewSubtask('');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
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
    setTaskData(prev => ({ ...prev, comments: updatedComments }));
    setNewComment('');
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
      setTaskData(prev => ({ ...prev, attachments: newAttachments }));
      toast.success('Dosya başarıyla yüklendi');
    } catch (error) {
      toast.error('Hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-950 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-3 flex-1 mr-4">
            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400">
              <Layout size={18} />
            </div>
            <input
              value={taskData.title}
              onChange={e => setTaskData({ ...taskData, title: e.target.value })}
              className="text-lg font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-400"
              placeholder="Görev başlığı..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition-all px-6"
            >
              Kaydet
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left Nav Rail */}
          <div className="w-16 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center py-6 gap-2 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
            {[
              { id: 'subtasks', icon: ListTodo, label: 'Alt Görevler', count: subtasks.filter(s => !s.completed).length },
              { id: 'comments', icon: MessageSquare, label: 'Yorumlar', count: comments.length },
              { id: 'files', icon: Paperclip, label: 'Dosyalar', count: attachments.length },
              { id: 'activity', icon: History, label: 'Geçmiş' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group ${activeSection === item.id
                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'text-slate-400 hover:bg-white hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                  }`}
                title={item.label}
              >
                <item.icon size={20} className="transition-transform group-hover:scale-110" />
                {item.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-950">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-950">
            <div className="max-w-3xl mx-auto">
              {activeSection === 'subtasks' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ListTodo size={16} /> Alt Görevler
                  </h3>

                  <div className="space-y-2 mb-6">
                    {subtasks.map(subtask => (
                      <div key={subtask.id} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                        <button
                          onClick={() => {
                            const updated = subtasks.map(s => s.id === subtask.id ? { ...s, completed: !s.completed } : s);
                            setSubtasks(updated);
                            setTaskData(prev => ({ ...prev, subtasks: updated }));
                          }}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${subtask.completed
                              ? 'bg-indigo-500 border-indigo-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-indigo-400'
                            }`}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <span className={`flex-1 text-sm ${subtask.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => {
                            const filtered = subtasks.filter(s => s.id !== subtask.id);
                            setSubtasks(filtered);
                            setTaskData(prev => ({ ...prev, subtasks: filtered }));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <Plus size={18} className="text-slate-400" />
                    <input
                      value={newSubtask}
                      onChange={e => setNewSubtask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="Yeni alt görev ekle..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400 font-medium"
                    />
                    <Button onClick={handleAddSubtask} disabled={!newSubtask.trim()} size="sm" variant="outline">Ekle</Button>
                  </div>
                </div>
              )}

              {activeSection === 'comments' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <MessageSquare size={16} /> Yorumlar
                  </h3>

                  <div className="flex gap-4 mb-8">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                      <AvatarImage src={currentUser?.avatar} />
                      <AvatarFallback>{currentUser?.fullName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative">
                      <Textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Yorumunuzu yazın..."
                        className="min-h-[100px] resize-none pr-20 pt-3 border-slate-200 focus:border-indigo-300 focus:ring-indigo-100"
                      />
                      <div className="absolute bottom-3 right-3">
                        <Button onClick={handleAddComment} disabled={!newComment.trim()} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">Gönder</Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex gap-4 group">
                        <Avatar className="w-8 h-8 mt-1 border border-slate-100">
                          <AvatarImage src={comment.userAvatar} />
                          <AvatarFallback>{comment.userName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{comment.userName}</span>
                            <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl rounded-tl-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'files' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* File Implement similar to subtasks but for files */}
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Paperclip size={16} /> Dosyalar
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <label className={`border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer transition-all group ${isUploading ? 'opacity-50' : ''}`}>
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform text-slate-500 group-hover:text-indigo-600">
                        <Plus size={20} />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-indigo-600">Dosya Yükle</span>
                    </label>

                    {attachments.map(file => (
                      <div key={file.id} className="relative group p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 hover:shadow-md transition-all bg-white dark:bg-slate-900">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                          {file.type?.includes('image') ? '🖼️' : '📄'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-slate-900 dark:text-white truncate hover:underline">
                            {file.name}
                          </a>
                          <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button
                          onClick={() => {
                            const filtered = attachments.filter(a => a.id !== file.id);
                            setAttachments(filtered);
                            setTaskData(prev => ({ ...prev, attachments: filtered }));
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'activity' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <History size={16} /> Görev Geçmişi
                  </h3>
                  <div className="text-center text-slate-500 py-10">
                    <History size={32} className="mx-auto mb-3 opacity-20" />
                    <p>Henüz geçmiş kaydı yok.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-80 border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-6 flex flex-col gap-6 overflow-y-auto">

            {/* Status Dropdown */}
            <div className="space-y-3 relative" ref={statusMenuRef}>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Durum</label>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentStatus.color }} />
                  <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{currentStatus.label}</span>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {showStatusMenu && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-1.5 z-10 animate-in zoom-in-95 duration-150">
                  {statuses.map(status => (
                    <button
                      key={status.id}
                      onClick={() => {
                        setTaskData({ ...taskData, status: status.id });
                        setShowStatusMenu(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{status.label}</span>
                      {taskData.status === status.id && <CheckCircle2 size={14} className="ml-auto text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Öncelik</label>
              <div className="grid grid-cols-2 gap-2">
                {priorities.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setTaskData({ ...taskData, priority: p.id })}
                    className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all border ${taskData.priority === p.id
                        ? 'border-transparent shadow-sm scale-105'
                        : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500 opacity-70 hover:opacity-100'
                      }`}
                    style={taskData.priority === p.id ? { backgroundColor: p.color, color: p.textColor } : {}}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Son Tarih</label>
              <div className="relative">
                <Input
                  type="date"
                  value={taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : ''}
                  onChange={e => setTaskData({ ...taskData, dueDate: e.target.value })}
                  className="pl-10 font-medium text-slate-700 bg-white"
                />
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Assignees */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atananlar</label>
              <div className="flex flex-wrap gap-2">
                {(taskData.assignees || []).map(id => {
                  const user = users.find(u => u._id === id);
                  if (!user) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-[10px] bg-slate-100">{user.fullName?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-slate-700">{user.fullName}</span>
                      <button onClick={() => setTaskData({ ...taskData, assignees: taskData.assignees.filter(uid => uid !== id) })} className="hover:text-red-500"><X size={12} /></button>
                    </div>
                  );
                })}
                <div className="relative group">
                  <button className="w-7 h-7 flex items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <Plus size={14} />
                  </button>
                  {/* Dropdown for adding users would go here */}
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 hidden group-hover:block p-1">
                    {users.filter(u => !taskData.assignees?.includes(u._id)).map(user => (
                      <button
                        key={user._id}
                        onClick={() => setTaskData({ ...taskData, assignees: [...(taskData.assignees || []), user._id] })}
                        className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded-lg text-sm text-left"
                      >
                        <Avatar className="w-5 h-5"><AvatarImage src={user.avatar} /></Avatar>
                        <span className="truncate">{user.fullName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ModernTaskModal;
