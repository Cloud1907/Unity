import React, { useState } from 'react';
import { X, Check, ChevronDown, Minus, ChevronUp, ChevronsUp, Clock, Zap, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useData } from '../contexts/DataContext';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { getAvatarUrl } from '../utils/avatarHelper';
import { filterProjectUsers } from '../utils/userHelper';
import InlineAssigneePicker from './InlineAssigneePicker';
import { toSkyISOString } from '../utils/dateUtils';

const NewTaskModal = ({ isOpen, onClose, projectId, defaultStatus = 'todo' }) => {
  const { createTask, projects, users } = useData();
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium',
    status: defaultStatus,
    assignees: [], // Array of IDs
    labels: [],
    startDate: toSkyISOString(new Date()).split('T')[0],
    dueDate: ''
  });

  // Reset form when modal closes or projectId changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(projectId || '');
      setFormData({
        title: '',
        priority: 'medium',
        status: defaultStatus,
        assignees: [],
        labels: [],
        startDate: toSkyISOString(new Date()).split('T')[0],
        dueDate: ''
      });
    }
  }, [isOpen, projectId, defaultStatus]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalProjectId = projectId || selectedProjectId;
    if (!finalProjectId) {
      alert('Lütfen bir proje seçiniz.');
      return;
    }

    setLoading(true);

    const taskData = {
      ...formData,
      projectId: Number(finalProjectId),
      startDate: toSkyISOString(formData.startDate || new Date()),
      dueDate: formData.dueDate ? toSkyISOString(formData.dueDate) : undefined,
      assignees: formData.assignees.map(id => Number(id)).filter(id => !isNaN(id) && id > 0).map(id => ({ userId: id })), // Map IDs to TaskAssignee objects for backend binding
      labels: formData.labels.map(id => ({ labelId: id })) // Labels might still need object if backend expects commands, but let's stick to previous pattern or check. 
      // Actually TaskRow uses specific helpers. Let's assume Labels need objects based on existing code, but assignees definitely failed as objects.
      // If TaskRow uses `updateTask(..., { labels: newLabels })` where InlineLabelPicker returns IDs... Let's check InlineLabelPicker if possible.
      // But for now, let's fix assignees first as that was the main change I saw being wrong.
    };

    // Remove undefined fields
    Object.keys(taskData).forEach(key => {
      if (taskData[key] === undefined || taskData[key] === '') {
        delete taskData[key];
      }
    });

    const result = await createTask(taskData);

    setLoading(false);

    if (result.success) {
      onClose();
    }
  };

  // Filter users for the selected project
  const projectUsers = React.useMemo(() => {
    const currentProject = projects.find(p => p.id == (projectId || selectedProjectId));
    return filterProjectUsers(currentProject, users);
  }, [users, projects, projectId, selectedProjectId]);

  // Extract workspace ID for user filtering
  const workspaceId = React.useMemo(() => {
    const currentProject = projects.find(p => p.id == (projectId || selectedProjectId));
    return currentProject?.departmentId || null;
  }, [projects, projectId, selectedProjectId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Yeni Görev</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Project Selection */}
          {!projectId && (
            <div>
              <Label htmlFor="project" className="text-xs font-semibold text-slate-500 mb-1.5 block">PROJE</Label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white transition-shadow"
              >
                <option value="">Proje Seçiniz...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title Input */}
          <div>
            <Label htmlFor="title" className="text-xs font-semibold text-slate-500 mb-1.5 block">GÖREV BAŞLIĞI</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ne yapılması gerekiyor?"
              required
              className="bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-500/50 text-base py-2.5"
              autoFocus
            />
          </div>

          {/* Compact Assignees */}
          <div>
            <Label className="text-xs font-semibold text-slate-500 mb-2 block">ATANAN KİŞİLER</Label>
            <div className="flex items-center">
              <InlineAssigneePicker
                assigneeIds={formData.assignees}
                allUsers={projectUsers}
                workspaceId={workspaceId}
                onChange={(newAssignees) => setFormData({ ...formData, assignees: newAssignees })}
              />
            </div>
          </div>

          {/* 2-Column Grid for Metadata */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">DURUM</Label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border-0 rounded-lg pl-9 pr-8 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="todo">Yapılacak</option>
                  <option value="working">Devam Ediyor</option>
                  <option value="stuck">Takıldı</option>
                  <option value="review">İncelemede</option>
                  <option value="done">Tamamlandı</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {formData.status === 'todo' && <Clock size={14} />}
                  {(formData.status === 'working' || formData.status === 'review') && <Zap size={14} />}
                  {formData.status === 'stuck' && <AlertCircle size={14} />}
                  {formData.status === 'done' && <CheckCircle size={14} />}
                </div>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Priority */}
            <div>
              <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">ÖNCELİK</Label>
              <div className="relative">
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border-0 rounded-lg pl-9 pr-8 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <AlertCircle size={14} />
                </div>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">BAŞLANGIÇ</Label>
              <Input
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="bg-slate-50 dark:bg-slate-800 border-0 text-sm py-2"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 mb-1.5 block">BİTİŞ</Label>
              <Input
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                className="bg-slate-50 dark:bg-slate-800 border-0 text-sm py-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-700">İptal</Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                disabled={loading}
              >
                {loading ? '...' : 'Oluştur'}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NewTaskModal;
