import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Calendar, User as UserIcon, MessageSquare, Paperclip, Clock, Plus, CheckCircle2, ListTodo, Trash2, History, ChevronDown, Layout } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { Calendar as CalendarComponent } from './ui/calendar';
import InlineLabelPicker from './InlineLabelPicker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { toast } from './ui/sonner';
import { auditAPI } from '../services/api';

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
  const { updateTask, users, projects } = useData();
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
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [openSubtaskAssignee, setOpenSubtaskAssignee] = useState(null);
  const [subtaskDropdownPos, setSubtaskDropdownPos] = useState({ top: 0, left: 0 }); // New state for portal position
  const [mainDropdownPos, setMainDropdownPos] = useState({ top: 0, left: 0 }); // New state for main portal position
  const [searchQuery, setSearchQuery] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const statusMenuRef = useRef(null);
  const assigneeMenuRef = useRef(null);

  // Get current project to filter users
  const currentProject = projects.find(p => p._id === task.projectId);

  // Filter users: must be in project members OR be the current user OR be admin
  const projectUsers = users.filter(u =>
    currentProject?.members?.includes(u._id) ||
    u._id === currentProject?.owner ||
    u.role === 'admin'
  );

  const filteredUsers = projectUsers.filter(u =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) setActiveSection(initialSection);
  }, [isOpen, initialSection]);

  // Click outside listener for menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(event.target) && !event.target.closest('.main-assignee-dropdown')) {
        setShowAssigneeMenu(false);
      }
      // Close subtask assignee dropdown ONLY if clicking outside of it
      if (openSubtaskAssignee !== null && !event.target.closest('.subtask-assignee-dropdown')) {
        setOpenSubtaskAssignee(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSubtaskAssignee]);

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

                        {/* Assignee Selector */}
                        <div className="relative">
                          {subtask.assignee ? (
                            <div className="flex items-center gap-1">
                              <Avatar
                                className="w-6 h-6 cursor-pointer hover:ring-2 hover:ring-indigo-100 transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (openSubtaskAssignee === subtask.id) {
                                    setOpenSubtaskAssignee(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    // Calculate position: open DOWNWARDS (top = bottom + gap)
                                    setSubtaskDropdownPos({
                                      top: rect.bottom + 8,
                                      left: rect.left - 200 // Shift left to keep in screen
                                    });
                                    setOpenSubtaskAssignee(subtask.id);
                                  }
                                }}
                              >
                                <AvatarImage src={users.find(u => u._id === subtask.assignee)?.avatar} />
                                <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-600">
                                  {users.find(u => u._id === subtask.assignee)?.fullName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = subtasks.map(s => s.id === subtask.id ? { ...s, assignee: null } : s);
                                  setSubtasks(updated);
                                  setTaskData(prev => ({ ...prev, subtasks: updated }));
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openSubtaskAssignee === subtask.id) {
                                  setOpenSubtaskAssignee(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setSubtaskDropdownPos({
                                    top: rect.bottom + 8,
                                    left: rect.left - 200
                                  });
                                  setOpenSubtaskAssignee(subtask.id);
                                }
                              }}
                              className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <UserIcon size={12} />
                            </button>
                          )}

                          {/* Dropdown - Using Portal to escape modal overflow */}
                          {openSubtaskAssignee === subtask.id && ReactDOM.createPortal(
                            <div
                              className="fixed z-[99999] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 animate-in zoom-in-95 duration-150 subtask-assignee-dropdown"
                              style={{
                                top: subtaskDropdownPos.top,
                                left: subtaskDropdownPos.left,
                                width: '16rem'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                placeholder="Kullanıcı ara..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="mb-2 h-9 text-sm"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {filteredUsers.length > 0 ? (
                                  filteredUsers.map(user => (
                                    <button
                                      key={user._id}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const updated = subtasks.map(s => s.id === subtask.id ? { ...s, assignee: user._id } : s);
                                        setSubtasks(updated);
                                        setTaskData(prev => ({ ...prev, subtasks: updated }));
                                        setOpenSubtaskAssignee(null);
                                        setSearchQuery('');
                                      }}
                                      className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-left transition-colors"
                                    >
                                      <Avatar className="w-5 h-5">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-[10px]">{user.fullName?.[0]}</AvatarFallback>
                                      </Avatar>
                                      <span className="truncate text-slate-700 dark:text-slate-200">{user.fullName}</span>
                                      {subtask.assignee === user._id && <CheckCircle2 size={14} className="ml-auto text-indigo-600" />}
                                    </button>
                                  ))
                                ) : (
                                  <div className="p-2 text-xs text-slate-400 text-center">Kullanıcı bulunamadı</div>
                                )}
                              </div>
                            </div>,
                            document.body
                          )}
                        </div>

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

                  <div className="space-y-4">
                    {/* Task Created */}
                    <div className="flex gap-4 relative">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 ring-4 ring-white dark:ring-slate-950">
                          <Plus size={14} />
                        </div>
                        <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 mt-2"></div>
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">Görev Oluşturuldu</span>
                          <span className="text-xs text-slate-400">
                            {new Date(taskData.createdAt || Date.now()).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {users.find(u => u._id === taskData.assignedBy)?.fullName || 'Kullanıcı'} tarafından oluşturuldu
                        </p>
                      </div>
                    </div>

                    {/* Status Changes */}
                    {taskData.status && (
                      <div className="flex gap-4 relative">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 ring-4 ring-white dark:ring-slate-950">
                            <CheckCircle2 size={14} />
                          </div>
                          <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">Durum Güncellendi</span>
                            <span className="text-xs text-slate-400">
                              {new Date(taskData.updatedAt || Date.now()).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Durum: <span className="font-medium" style={{ color: statuses.find(s => s.id === taskData.status)?.color }}>
                              {statuses.find(s => s.id === taskData.status)?.label}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Subtasks Added */}
                    {subtasks.length > 0 && (
                      <div className="flex gap-4 relative">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 ring-4 ring-white dark:ring-slate-950">
                            <ListTodo size={14} />
                          </div>
                          <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">Alt Görevler</span>
                            <span className="text-xs text-slate-400">Şimdi</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {subtasks.length} alt görev • {subtasks.filter(s => s.completed).length} tamamlandı
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Comments Added */}
                    {comments.length > 0 && (
                      <div className="flex gap-4 relative">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 ring-4 ring-white dark:ring-slate-950">
                            <MessageSquare size={14} />
                          </div>
                          <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">Yorumlar</span>
                            <span className="text-xs text-slate-400">Şimdi</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {comments.length} yorum eklendi
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 ring-4 ring-white dark:ring-slate-950">
                            <Paperclip size={14} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">Dosyalar</span>
                            <span className="text-xs text-slate-400">Şimdi</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {attachments.length} dosya eklendi
                          </p>
                        </div>
                      </div>
                    )}
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

            {/* Progress - Manual Slider */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">İlerleme</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Tamamlanma</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{taskData.progress || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${taskData.progress || 0}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={taskData.progress || 0}
                  onChange={(e) => setTaskData({ ...taskData, progress: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700"
                  style={{
                    background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${taskData.progress || 0}%, rgb(226 232 240) ${taskData.progress || 0}%, rgb(226 232 240) 100%)`
                  }}
                />
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
                <div className="relative" ref={assigneeMenuRef}>
                  <button
                    onClick={(e) => {
                      if (showAssigneeMenu) {
                        setShowAssigneeMenu(false);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMainDropdownPos({
                          top: rect.bottom + 8, // Open downwards
                          left: rect.left - 200 // Align roughly or offset
                        });
                        setShowAssigneeMenu(true);
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <Plus size={14} />
                  </button>

                  {/* Dropdown for adding users - Portal */}
                  {showAssigneeMenu && ReactDOM.createPortal(
                    <div
                      className="fixed z-[99999] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 animate-in zoom-in-95 duration-150 main-assignee-dropdown"
                      style={{
                        top: mainDropdownPos.top,
                        left: mainDropdownPos.left,
                        width: '18rem'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        placeholder="Kullanıcı ara..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="mb-2 h-9 text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.filter(u => !taskData.assignees?.includes(u._id)).length > 0 ? (
                            filteredUsers.filter(u => !taskData.assignees?.includes(u._id)).map(user => (
                              <button
                                key={user._id}
                                onClick={() => {
                                  setTaskData({ ...taskData, assignees: [...(taskData.assignees || []), user._id] });
                                  setShowAssigneeMenu(false);
                                  setSearchQuery('');
                                }}
                                className="flex items-center gap-3 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-left transition-colors"
                              >
                                <Avatar className="w-6 h-6 border border-slate-100">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback className="text-[10px] bg-slate-100">{user.fullName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                  <span className="block truncate font-medium text-slate-700 dark:text-slate-200">{user.fullName}</span>
                                  <span className="block truncate text-xs text-slate-400">{user.email}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-xs text-slate-400 text-center">Tüm uygun kullanıcılar eklendi</div>
                          )
                        ) : (
                          <div className="p-3 text-xs text-slate-400 text-center">Kullanıcı bulunamadı</div>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Etiketler</label>
              <div className="bg-white border border-slate-200 dark:border-slate-700 rounded-lg p-2 min-h-[42px] flex items-center">
                <InlineLabelPicker
                  taskId={taskData._id}
                  projectId={taskData.projectId}
                  currentLabels={taskData.labels || []}
                  onUpdate={async (tid, newLabels) => {
                    // Update local state immediately
                    setTaskData(prev => ({ ...prev, labels: newLabels }));
                    // Also trigger parent update if needed, but InlineLabelPicker usually calls updateTask
                    // We might need to handle the API call here if InlineLabelPicker expects an onUpdate that does the API call
                    // Let's check InlineLabelPicker props: onUpdate(taskId, newLabels)
                    // It calls onUpdate. If we pass this, we update LOCAL state. 
                    // AND we should probably call updateTask too? 
                    // ModernTaskModal saves changes via "handleSave" generally, but inline controls might save immediately.
                    // If InlineLabelPicker logic is "update on click", it expects `onUpdate` to persist it.
                    // We should call `updateTask(tid, { tags: newLabels })`? Or `labels`.
                    // DataContext `updateTask` takes data.
                    await updateTask(tid, { labels: newLabels });
                  }}
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Başlangıç Tarihi</label>
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-medium bg-white border-slate-200 dark:border-slate-700 hover:bg-slate-50",
                        !taskData.startDate && "text-slate-400"
                      )}
                    >
                      <Calendar size={16} className="mr-2 text-slate-400" />
                      {taskData.startDate ? (
                        format(new Date(taskData.startDate), "d MMMM yyyy", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[99999]" align="start" side="bottom">
                    <CalendarComponent
                      mode="single"
                      selected={taskData.startDate ? new Date(taskData.startDate) : undefined}
                      onSelect={(date) => setTaskData({ ...taskData, startDate: date ? date.toISOString() : null })}
                      initialFocus
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Son Tarih</label>
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-medium bg-white border-slate-200 dark:border-slate-700 hover:bg-slate-50",
                        !taskData.dueDate && "text-slate-400"
                      )}
                    >
                      <Calendar size={16} className="mr-2 text-slate-400" />
                      {taskData.dueDate ? (
                        format(new Date(taskData.dueDate), "d MMMM yyyy", { locale: tr })
                      ) : (
                        <span>Tarih seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[99999]" align="start" side="bottom">
                    <CalendarComponent
                      mode="single"
                      selected={taskData.dueDate ? new Date(taskData.dueDate) : undefined}
                      onSelect={(date) => setTaskData({ ...taskData, dueDate: date ? date.toISOString() : null })}
                      initialFocus
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
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
