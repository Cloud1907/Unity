import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Calendar, User as UserIcon, MessageSquare, Paperclip, Clock, Plus, CheckCircle2, Check, ListTodo, Trash2, History, ChevronDown, Layout, Upload, File, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { Calendar as CalendarComponent } from './ui/calendar';
import InlineLabelPicker from './InlineLabelPicker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl } from '../utils/avatarHelper';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { toast } from 'sonner';
import api, { auditAPI } from '../services/api';
import ConfirmModal from './ui/ConfirmModal';

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
  const { updateTask, deleteTask, createSubtask, users, projects, refreshTask } = useData();
  const { user: currentUser } = useAuth();

  // Helper to normalize IDs from object arrays (Backend sends {userId: 1} objects, UI wants [1])
  const getIds = (list, key = 'userId') => {
    if (!list) return [];
    return list.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item[key] || item.id || item._id || item.labelId;
      }
      return item;
    });
  };

  // Helper to normalize subtasks (Backend: assigneeId, Frontend: assignee)
  const normalizeSubtasks = (list) => {
    if (!list) return [];
    return list.map(s => ({
      ...s,
      assignee: s.assignee || s.assigneeId
    }));
  };



  const [taskData, setTaskData] = useState(() => ({
    ...task,
    assignees: getIds(task.assignees, 'userId'),
    labels: getIds(task.labels, 'labelId')
  }));
  const [subtasks, setSubtasks] = useState(normalizeSubtasks(task.subtasks || []));
  const [comments, setComments] = useState(task.comments || []);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [activeSection, setActiveSection] = useState(initialSection);

  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [openSubtaskAssignee, setOpenSubtaskAssignee] = useState(null);
  const [subtaskDropdownPos, setSubtaskDropdownPos] = useState({ top: 0, left: 0 });
  const [mainDropdownPos, setMainDropdownPos] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Filter users based on search and workspace/department context
  const filteredUsers = React.useMemo(() => {
    // 1. Determine Project Department
    const currentProject = projects.find(p => p._id === task.projectId || p.id === task.projectId);
    const projectDeptId = currentProject?.departmentId || currentProject?.department;

    // 2. Filter by search query first
    let result = users.filter(u =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 3. Filter by Department (if applicable)
    if (projectDeptId) {
      result = result.filter(u => {
        const userDepts = u.departments || (u.department ? [u.department] : []);
        return userDepts.some(d => d == projectDeptId);
      });
    }

    return result;
  }, [users, searchQuery, task.projectId, projects]);

  const [isDragging, setIsDragging] = useState(false);

  // Fetch activity logs when section becomes 'activity'
  useEffect(() => {
    if (activeSection === 'activity' && (task.id || task._id)) {
      loadActivityLogs();
    }
  }, [activeSection, task]);

  const loadActivityLogs = async () => {
    setLoadingLogs(true);
    try {
      const taskId = task.id || task._id;
      const response = await auditAPI.getTaskLogs(taskId);
      setActivityLogs(response.data);
    } catch (error) {
      console.error("Failed to load audit logs", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload({ target: { files: [files[0]] } });
    }
  };

  const statusMenuRef = useRef(null);
  const assigneeMenuRef = useRef(null);

  // ... existing code ...

  useEffect(() => {
    if (isOpen) setActiveSection(initialSection);
  }, [isOpen, initialSection]);

  // Sync state with task prop when it changes
  useEffect(() => {
    setTaskData({
      ...task,
      assignees: getIds(task.assignees, 'userId'),
      labels: getIds(task.labels, 'labelId')
    });
    setSubtasks(normalizeSubtasks(task.subtasks || []));
    setComments(task.comments || []);
    setAttachments(task.attachments || []);
  }, [task]);

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

  // Track if fields are dirty
  const isDirty = (
    JSON.stringify(taskData.assignees) !== JSON.stringify(getIds(task.assignees, 'userId')) ||
    JSON.stringify(taskData.labels) !== JSON.stringify(getIds(task.labels, 'labelId')) ||
    JSON.stringify(subtasks) !== JSON.stringify(normalizeSubtasks(task.subtasks || [])) ||
    JSON.stringify(comments) !== JSON.stringify(task.comments || []) ||
    JSON.stringify(attachments) !== JSON.stringify(task.attachments || [])
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseAttempt();
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, taskData, subtasks, attachments, comments]);

  if (!isOpen) return null;

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowUnsavedModal(false);
    onClose();
  };

  const handleSave = async () => {
    try {
      // 1. Prepare CLEAN Payload with PascalCase Keys matches C# Model
      // Using PascalCase avoids issues if the backend JSON deserializer is case-sensitive.
      // e.g. "id" (from js) -> might not map to "Id" (C#) if strict, defaulting Id to 0.
      // Then "if (id != task.Id)" check fails (400 Bad Request).

      const payload = {
        Id: task.id || task._id,
        ProjectId: task.projectId,
        Title: taskData.title,
        Description: taskData.description,
        Status: taskData.status,
        Priority: taskData.priority,
        TShirtSize: taskData.tShirtSize,
        StartDate: taskData.startDate,
        DueDate: taskData.dueDate,
        Progress: taskData.progress,
        IsPrivate: taskData.isPrivate,

        // Use PascalCase for Nested Objects too
        Assignees: (taskData.assignees || []).map(uid => ({ UserId: uid })),
        Labels: (taskData.labels || []).map(lid => ({ LabelId: lid }))
      };

      // Send Clean Payload
      // Note: URL ID is also used by backend controller check.
      const taskId = task.id || task._id;
      await updateTask(taskId, payload);

      // 3. UI Feedback
      toast.success('Görev başarıyla güncellendi');
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
      const msg = error.response?.data?.title || error.message;
      toast.error('Görev güncellenemedi: ' + msg);

      if (error.response?.status === 400) {
        console.error("400 Bad Request Details:", error.response.data);
      }
    }
  };

  const currentStatus = statuses.find(s => s.id === taskData.status) || statuses[0];

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    const titleToAdd = newSubtask;
    setNewSubtask(''); // Clear immediately for better UX

    // Use Context Action
    const result = await createSubtask(task.id || task._id, {
      title: titleToAdd,
      isCompleted: false,
      assigneeId: currentUser?.id // Default assign to current user
    });

    if (result.success) {
      const createdSubtask = result.data;
      // Normalize immediately for UI consistency (assignee vs assigneeId)
      const normalizedForUI = {
        ...createdSubtask,
        assignee: createdSubtask.assignee || createdSubtask.assigneeId
      };

      const newSubtasks = [...subtasks, normalizedForUI];
      setSubtasks(newSubtasks);
      setTaskData(prev => ({ ...prev, subtasks: newSubtasks }));

      // No need to refreshTask heavily if context is updated correctly, 
      // but keeping it for safety/deep sync if needed.
    } else {
      // Validation/Error fallback: restore text if failed
      setNewSubtask(titleToAdd);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/tasks/${task.id}/comments`, {
        text: newComment
      });

      const createdComment = response.data;
      // Ensure frontend model structure matches
      const commentForUI = {
        ...createdComment,
        userAvatar: currentUser?.avatar,
        userName: currentUser?.fullName
      };

      const updatedComments = [...comments, commentForUI];
      setComments(updatedComments);
      setTaskData(prev => ({ ...prev, comments: updatedComments }));
      setNewComment('');
      await refreshTask(task.id || task._id);
    } catch (error) {
      console.error(error);
      toast.error('Yorum eklenemedi');
    }
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
      // Use centralized api instance
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      const newAttachment = {
        id: Date.now(),
        name: file.name,
        url: data.url, // Backend returns relative URL like "/uploads/xxx.jpg"
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      const newAttachments = [...attachments, newAttachment];
      setAttachments(newAttachments);
      setTaskData(prev => ({ ...prev, attachments: newAttachments }));

      // Immediately save attachments to backend using PATCH - format for backend
      const taskId = task.id || task._id;
      const attachmentPayload = newAttachments.map(att => ({
        name: att.name,
        url: att.url,
        type: att.type || 'unknown',
        size: att.size || 0
      }));

      // Use direct PATCH to save only attachments 
      await api.patch(`/tasks/${taskId}`, { attachments: attachmentPayload });

      await refreshTask(taskId);
      toast.success('Dosya başarıyla yüklendi');
    } catch (error) {
      console.error('File upload error:', error);
      // Revert on error - remove the last attachment
      const revertedAttachments = attachments; // Original state
      setAttachments(revertedAttachments);
      setTaskData(prev => ({ ...prev, attachments: revertedAttachments }));

      if (error.message !== 'Update failed') {
        toast.error('Dosya yüklenemedi');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6">
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
              onClick={handleCloseAttempt}
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
                  <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                    <ListTodo size={16} /> Alt Görevler
                  </h3>

                  <div className="space-y-2 mb-6">
                    {subtasks.map(subtask => (
                      <div key={subtask.id} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">

                        {/* Checkbox */}
                        <div className={`relative flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border transition-all cursor-pointer ${subtask.isCompleted
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                          }`}>
                          <input
                            type="checkbox"
                            checked={subtask.isCompleted || false}
                            onChange={async (e) => {
                              const newStatus = e.target.checked;
                              const updated = subtasks.map(s => s.id === subtask.id ? { ...s, isCompleted: newStatus } : s);
                              setSubtasks(updated);
                              setTaskData(prev => ({ ...prev, subtasks: updated }));
                              try {
                                await api.put(`/tasks/subtasks/${subtask.id}`, {
                                  title: subtask.title,
                                  isCompleted: newStatus,
                                  assigneeId: subtask.assigneeId,
                                  startDate: subtask.startDate,
                                  dueDate: subtask.dueDate
                                });
                              } catch (error) {
                                console.error("Subtask update failed", error);
                                toast.error("Güncelleme başarısız");
                                setSubtasks(subtasks);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          {subtask.isCompleted && <Check size={12} className="text-white" />}
                        </div>

                        {/* Title */}
                        <input
                          value={subtask.title}
                          onChange={(e) => {
                            const updated = subtasks.map(s => s.id === subtask.id ? { ...s, title: e.target.value } : s);
                            setSubtasks(updated);
                          }}
                          onBlur={async () => {
                            try {
                              await api.put(`/tasks/subtasks/${subtask.id}`, {
                                title: subtask.title,
                                isCompleted: subtask.isCompleted,
                                assigneeId: subtask.assigneeId,
                                startDate: subtask.startDate,
                                dueDate: subtask.dueDate
                              });
                            } catch (e) { console.error(e); }
                          }}
                          className={`flex-1 bg-transparent border-none text-sm outline-none focus:ring-0 px-2 ${subtask.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}
                        />

                        {/* Actions Container */}
                        <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">

                          {/* Assignee */}
                          <div className={`relative ${subtask.isCompleted ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            {subtask.assignee ? (
                              <div className="relative group/avatar">
                                <Avatar
                                  className="w-6 h-6 cursor-pointer hover:ring-2 hover:ring-indigo-100 transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (openSubtaskAssignee === subtask.id) setOpenSubtaskAssignee(null);
                                    else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setSubtaskDropdownPos({ top: rect.bottom + 8, left: rect.left - 200 });
                                      setOpenSubtaskAssignee(subtask.id);
                                    }
                                  }}
                                >
                                  <AvatarImage src={users.find(u => u._id == subtask.assignee)?.avatar ? getAvatarUrl(users.find(u => u._id == subtask.assignee)?.avatar) : ''} />
                                  <AvatarFallback
                                    className="text-[10px] font-bold text-white"
                                    style={{ backgroundColor: users.find(u => u._id == subtask.assignee)?.color || '#6366f1' }}
                                  >
                                    {users.find(u => u._id == subtask.assignee)?.fullName?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = subtasks.map(s => s.id === subtask.id ? { ...s, assignee: null } : s);
                                    setSubtasks(updated);
                                    setTaskData(prev => ({ ...prev, subtasks: updated }));
                                    api.put(`/tasks/subtasks/${subtask.id}`, {
                                      title: subtask.title,
                                      isCompleted: subtask.isCompleted,
                                      assigneeId: null, // Robust null assignment
                                      startDate: subtask.startDate,
                                      dueDate: subtask.dueDate
                                    }).catch(console.error);
                                  }}
                                  className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full shadow border border-slate-200 p-0.5 text-slate-400 hover:text-red-500 opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                                >
                                  <X size={8} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (openSubtaskAssignee === subtask.id) setOpenSubtaskAssignee(null);
                                  else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setSubtaskDropdownPos({ top: rect.bottom + 8, left: rect.left - 200 });
                                    setOpenSubtaskAssignee(subtask.id);
                                  }
                                }}
                                className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                                title="Kişi Ata"
                              >
                                <UserIcon size={12} />
                              </button>
                            )}

                            {/* Assignee Dropdown Portal */}
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
                                          api.put(`/tasks/subtasks/${subtask.id}`, {
                                            title: subtask.title,
                                            isCompleted: subtask.isCompleted,
                                            assigneeId: user._id,
                                            startDate: subtask.startDate,
                                            dueDate: subtask.dueDate
                                          }).catch(console.error);
                                        }}
                                        className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm text-left transition-colors"
                                      >
                                        <Avatar className="w-5 h-5">
                                          <AvatarImage src={user.avatar ? getAvatarUrl(user.avatar) : ''} />
                                          <AvatarFallback
                                            className="text-[10px] font-bold text-white"
                                            style={{ backgroundColor: user.color || '#6366f1' }}
                                          >
                                            {user.fullName?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate text-slate-700 dark:text-slate-200">{user.fullName}</span>
                                        {subtask.assignee == user._id && <CheckCircle2 size={14} className="ml-auto text-indigo-600" />}
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

                          {/* Start Date */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-all ${subtask.startDate
                                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
                                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  } ${subtask.isCompleted ? 'opacity-50 pointer-events-none line-through decoration-slate-400' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                                title="Başlangıç Tarihi"
                              >
                                {subtask.startDate ? (
                                  format(new Date(subtask.startDate), 'd MMM', { locale: tr })
                                ) : (
                                  <Calendar size={12} />
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[99999]" align="end">
                              <CalendarComponent
                                mode="single"
                                selected={subtask.startDate ? new Date(subtask.startDate) : undefined}
                                onSelect={(date) => {
                                  const updated = subtasks.map(s => s.id === subtask.id ? { ...s, startDate: date ? date.toISOString() : null } : s);
                                  setSubtasks(updated);
                                  setTaskData(prev => ({ ...prev, subtasks: updated }));
                                  api.put(`/tasks/subtasks/${subtask.id}`, { ...subtask, startDate: date ? date.toISOString() : null }).catch(console.error);
                                }}
                                initialFocus
                                locale={tr}
                              />
                            </PopoverContent>
                          </Popover>

                          {/* Due Date */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-all ${subtask.dueDate
                                  ? (new Date(subtask.dueDate) < new Date() && !subtask.isCompleted
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800')
                                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  } ${subtask.isCompleted ? 'opacity-50 pointer-events-none line-through decoration-slate-400' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                                title="Son Tarih"
                              >
                                {subtask.dueDate ? (
                                  format(new Date(subtask.dueDate), 'd MMM', { locale: tr })
                                ) : (
                                  <Calendar size={12} />
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 z-[99999]" align="end">
                              <CalendarComponent
                                mode="single"
                                selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                                onSelect={(date) => {
                                  const updated = subtasks.map(s => s.id === subtask.id ? { ...s, dueDate: date ? date.toISOString() : null } : s);
                                  setSubtasks(updated);
                                  setTaskData(prev => ({ ...prev, subtasks: updated }));
                                  api.put(`/tasks/subtasks/${subtask.id}`, { ...subtask, dueDate: date ? date.toISOString() : null }).catch(console.error);
                                }}
                                initialFocus
                                locale={tr}
                              />
                            </PopoverContent>
                          </Popover>

                          {/* Delete */}
                          <button
                            onClick={async () => {
                              if (!window.confirm("Alt görevi silmek istediğinize emin misiniz?")) return;
                              const filtered = subtasks.filter(s => s.id !== subtask.id);
                              setSubtasks(filtered);
                              try {
                                await api.delete(`/tasks/subtasks/${subtask.id}`);
                                toast.success('Alt görev silindi');
                              } catch (e) {
                                toast.error('Silme başarısız');
                                setSubtasks(subtasks);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
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
                  <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                    <MessageSquare size={16} /> Yorumlar
                  </h3>

                  <div className="flex gap-4 mb-8">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                      <AvatarImage src={currentUser?.avatar ? getAvatarUrl(currentUser?.avatar) : ''} />
                      <AvatarFallback
                        className="font-bold text-xs text-white"
                        style={{ backgroundColor: currentUser?.color || '#6366f1' }}
                      >
                        {currentUser?.fullName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
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
                          <AvatarImage src={(comment.user?.avatar || comment.userAvatar) ? getAvatarUrl(comment.user?.avatar || comment.userAvatar) : ''} />
                          <AvatarFallback
                            className="font-bold text-[10px] text-white"
                            style={{ backgroundColor: comment.user?.color || '#6366f1' }}
                          >
                            {(comment.user?.fullName || comment.userName)?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 group/comment relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">{comment.user?.fullName || comment.userName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              {(currentUser?.role === 'admin' || comment.createdBy === currentUser?.id || taskData.assignedBy === currentUser?.id) && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Yorumu silmek istediğinize emin misiniz?')) {
                                      const filtered = comments.filter(c => c.id !== comment.id);
                                      setComments(filtered); // Optimistic
                                      try {
                                        await api.delete(`/tasks/comments/${comment.id}`);
                                        toast.success('Yorum silindi');
                                      } catch (e) {
                                        console.error(e);
                                        toast.error('Silme başarısız');
                                        setComments(comments); // Revert
                                      }
                                    }
                                  }}
                                  className="opacity-0 group-hover/comment:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                                  title="Yorumu sil"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
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
                  <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                    <Paperclip size={16} /> Dosyalar
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group overflow-hidden
                        ${isDragging
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }
                        ${isUploading ? 'pointer-events-none opacity-80' : ''}
                      `}
                    >
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />

                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                          <span className="text-sm font-medium text-indigo-600">Yükleniyor...</span>
                        </div>
                      ) : (
                        <>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                            ${isDragging ? 'bg-indigo-100 text-indigo-600 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-slate-800 dark:group-hover:text-indigo-400'}
                          `}>
                            <Upload size={24} />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                              Dosya Seç veya Sürükle
                            </span>
                            <p className="text-xs text-slate-400 mt-1">
                              Max 10MB (PNG, JPG, PDF)
                            </p>
                          </div>
                        </>
                      )}
                    </label>

                    {attachments.map(file => (
                      <div key={file.id} className="relative group p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 hover:shadow-md transition-all bg-white dark:bg-slate-900 overflow-hidden">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                          ${file.type?.includes('image') ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}
                        `}>
                          {file.type?.includes('image') ? <ImageIcon size={20} /> : <FileText size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <a href={file.url?.startsWith('http') ? file.url : `${process.env.REACT_APP_BACKEND_URL || ''}${file.url}`} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-slate-900 dark:text-white truncate hover:text-indigo-600 transition-colors">
                            {file.name}
                          </a>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(file.uploadedAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={file.url?.startsWith('http') ? file.url : `${process.env.REACT_APP_BACKEND_URL || ''}${file.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="İndir"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Dosyayı silmek istediğinize emin misiniz?')) return;
                              try {
                                await api.delete(`/tasks/attachments/${file.id}`);
                                const filtered = attachments.filter(a => a.id !== file.id);
                                setAttachments(filtered);
                                setTaskData(prev => ({ ...prev, attachments: filtered }));
                                toast.success('Dosya silindi');
                              } catch (error) {
                                console.error(error);
                                toast.error('Dosya silinemedi');
                              }
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'activity' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
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
              <label className="text-xs font-bold text-slate-400">Durum</label>
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
              <label className="text-xs font-bold text-slate-400">Öncelik</label>
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
              <label className="text-xs font-bold text-slate-400">İlerleme</label>
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
              <label className="text-xs font-bold text-slate-400">Atananlar</label>
              <div className="flex flex-wrap gap-2">
                {(taskData.assignees || []).map(id => {
                  const user = users.find(u => (u._id || u.id) == id);
                  if (!user) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={user.avatar ? getAvatarUrl(user.avatar) : ''} />
                        <AvatarFallback
                          className="text-[10px] font-bold text-white"
                          style={{ backgroundColor: user.color || '#6366f1' }}
                        >
                          {user.fullName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
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
                          filteredUsers.filter(u => !taskData.assignees?.includes(u._id || u.id)).length > 0 ? (
                            filteredUsers.filter(u => !taskData.assignees?.includes(u._id || u.id)).map(user => (
                              <button
                                key={user._id}
                                onClick={() => {
                                  setTaskData({ ...taskData, assignees: [...(taskData.assignees || []), user._id || user.id] });
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
              <label className="text-xs font-bold text-slate-400">Etiketler</label>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 min-h-[42px] flex items-center">
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
              <label className="text-xs font-bold text-slate-400">Başlangıç Tarihi</label>
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
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
              <label className="text-xs font-bold text-slate-400">Son Tarih</label>
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
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



            {/* Delete Button (Owner Only) */}
            {(currentUser?.role === 'admin' || taskData.createdBy === currentUser?.id || (!taskData.createdBy && taskData.assignedBy === currentUser?.id)) && (
              <div className="pt-6 mt-auto border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={async () => {
                    if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
                      await deleteTask(task._id);
                      onClose();
                      toast.success('Görev silindi');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} />
                  Görevi Sil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );

  return (
    <>
      {ReactDOM.createPortal(modalContent, document.body)}
      <ConfirmModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onConfirm={confirmClose}
        title="Kaydedilmemiş Değişiklikler"
        message="Yaptığınız değişiklikler kaydedilmedi. Çıkarsanız bu değişiklikler kaybolacak. Emin misiniz?"
        confirmText="Evet, Çık"
        cancelText="İptal Et"
        type="warning"
      />
    </>
  );
};

export default ModernTaskModal;
