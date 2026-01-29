import React, { useState } from 'react';
import { X, Check, ChevronDown, Minus, ChevronUp, ChevronsUp, Clock, Zap, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useData } from '../contexts/DataContext';

const NewTaskModal = ({ isOpen, onClose, projectId, defaultStatus = 'todo' }) => {
  const { createTask, projects, users } = useData();
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  const [formData, setFormData] = useState({
    title: '',
    // description removed
    priority: 'medium',
    status: defaultStatus,
    assignees: [],
    labels: [],
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    isPrivate: false
  });

  // Reset form when modal closes or projectId changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(projectId || '');
      setFormData({
        title: '',
        // description removed
        priority: 'medium',
        status: defaultStatus,
        assignees: [],
        labels: [],
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        isPrivate: false
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

    // Validate Project Selection if not provided via props
    const finalProjectId = projectId || selectedProjectId;
    if (!finalProjectId) {
      alert('Lütfen bir proje seçiniz.'); // Simple alert, could be toast
      return;
    }

    setLoading(true);

    const taskData = {
      ...formData,
      projectId: finalProjectId,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
      // Remove empty dueDate to avoid validation error
      dueDate: formData.dueDate || undefined,
      // Transform IDs to Entity Objects for Backend Binding
      assignees: formData.assignees.map(id => ({ userId: id })),
      labels: formData.labels.map(id => ({ labelId: id }))
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Yeni Görev Oluştur</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Project Selection (Only if not provided) */}
          {!projectId && (
            <div>
              <Label htmlFor="project" className="dark:text-gray-300">Proje Seçin *</Label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
              >
                <option value="">Proje Seçiniz...</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="title" className="dark:text-gray-300">Görev Başlığı *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ana sayfa tasarımı"
              required
              required
              className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* Assignees Selection (New) */}
          <div>
            <Label className="dark:text-gray-300">Atanacak Kişiler</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
              {users.filter(user => {
                // Determine the selected project's department
                const currentProject = projects.find(p => p._id === (projectId || selectedProjectId) || p.id === (projectId || selectedProjectId));
                const projectDeptId = currentProject?.departmentId || currentProject?.department;

                // If project has no department (or personal), show all users (or maybe just me? defaulting to all for flexibility)
                if (!projectDeptId) return true;

                // If project has a department, check if user belongs to it
                const userDepts = user.departments || (user.department ? [user.department] : []);
                // Compare loosely (string/int)
                return userDepts.some(d => d == projectDeptId);
              }).map(user => {
                const isSelected = formData.assignees.includes(user._id || user.id);
                return (
                  <div
                    key={user._id || user.id}
                    onClick={() => {
                      const uid = user._id || user.id;
                      const newAssignees = isSelected
                        ? formData.assignees.filter(id => id !== uid)
                        : [...formData.assignees, uid];
                      setFormData({ ...formData, assignees: newAssignees });
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-500/50'
                      : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 dark:border-gray-500'}`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{user.fullName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority" className="dark:text-gray-300 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-gray-400" />
                Öncelik
              </Label>
              <div className="relative mt-1">
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] appearance-none"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  {formData.priority === 'low' && <ChevronDown size={14} />}
                  {formData.priority === 'medium' && <Minus size={14} />}
                  {formData.priority === 'high' && <ChevronUp size={14} />}
                  {formData.priority === 'urgent' && <ChevronsUp size={14} />}
                </div>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="dark:text-gray-300 flex items-center gap-1.5">
                <Zap size={14} className="text-gray-400" />
                Durum
              </Label>
              <div className="relative mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] appearance-none"
                >
                  <option value="todo">Yapılacak</option>
                  <option value="working">Devam Ediyor</option>
                  <option value="stuck">Takıldı</option>
                  <option value="review">İncelemede</option>
                  <option value="done">Tamamlandı</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  {formData.status === 'todo' && <Clock size={14} />}
                  {(formData.status === 'working' || formData.status === 'review') && <Zap size={14} />}
                  {formData.status === 'stuck' && <AlertCircle size={14} />}
                  {formData.status === 'done' && <CheckCircle size={14} />}
                </div>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="dark:text-gray-300">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <Label htmlFor="dueDate" className="dark:text-gray-300">Son Tarih</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <input
              type="checkbox"
              id="isPrivate"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1">
              <Label htmlFor="isPrivate" className="font-medium cursor-pointer mb-0">Özel Görev (Private)</Label>
              <p className="text-xs text-gray-500">Sadece siz ve atanan kişiler görebilir.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-[#6366f1] hover:bg-[#5558e3]"
              disabled={loading}
            >
              {loading ? 'Oluşturuluyor...' : 'Görev Oluştur'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;
