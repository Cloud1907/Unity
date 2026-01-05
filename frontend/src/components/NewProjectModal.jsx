import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const NewProjectModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { createProject, departments, fetchDepartments } = useData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#0086c0',
    priority: 'medium',
    status: 'planning',
    department: '',
    isPrivate: false
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        icon: '📁',
        color: '#0086c0',
        priority: 'medium',
        status: 'planning',
        department: '', // Will be set automatically for non-admins below
        isPrivate: false
      });
    } else {
      fetchDepartments();
    }
  }, [isOpen, fetchDepartments]);

  // Filter departments based on role
  const availableDepartments = React.useMemo(() => {
    if (user?.role === 'admin') return departments;
    return departments.filter(d => d.name === user?.department);
  }, [departments, user]);

  // Auto-select department if single option
  React.useEffect(() => {
    if (isOpen && availableDepartments.length === 1 && !formData.department) {
      setFormData(prev => ({ ...prev, department: availableDepartments[0].name }));
    }
  }, [isOpen, availableDepartments, formData.department]);

  const icons = ['📁', '🎯', '🚀', '💼', '🌟', '⚡', '🔥', '💡', '🎨', '🏆'];
  const colors = ['#0086c0', '#6366f1', '#8b5cf6', '#00c875', '#fdab3d', '#e2445c', '#ff5a5f'];

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await createProject({
      ...formData,
      owner: user._id,
      members: [user._id]
    });

    setLoading(false);

    if (result.success) {
      // Close modal immediately
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Yeni Proje Oluştur</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <Label htmlFor="name">Proje Adı *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Web Sitesi Yenileme"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Proje hakkında kısa bir açıklama..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label>İkon Seç</Label>
            <div className="grid grid-cols-10 gap-2 mt-2">
              {icons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-2xl p-3 rounded-lg border-2 transition-all hover:scale-110 ${formData.icon === icon ? 'border-[#6366f1] bg-blue-50' : 'border-gray-200'
                    }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Renk Seç</Label>
            <div className="flex gap-2 mt-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>



          <div className="space-y-4">
            <div>
              <Label htmlFor="department">Departman Seçin</Label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
              >
                <option value="">Departman Seçilmedi</option>
                {availableDepartments.map(dept => (
                  <option key={dept._id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 italic">Departman seçilirse projeniz o departmandaki herkes tarafından görülebilir.</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div className="flex-1">
                <Label htmlFor="isPrivate" className="font-semibold text-blue-900 mb-0 cursor-pointer">Özel Proje (Private)</Label>
                <p className="text-sm text-blue-700">Bu seçeneği işaretlerseniz, departman seçili olsa bile proje sadece sahibi ve eklenen üyeler tarafından görülebilir.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-[#6366f1] hover:bg-[#5558e3]"
              disabled={loading}
            >
              {loading ? 'Oluşturuluyor...' : 'Proje Oluştur'}
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

export default NewProjectModal;
