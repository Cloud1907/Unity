import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from './ui/sonner';
import {
  X, Folder, Briefcase, Target, Rocket, Star, Zap, Users, BarChart, Calendar, Globe, Shield, Code,
  Cpu, Database, Layout, Layers, Box, Cpu as Chip, HardDrive, Network, GitBranch,
  Puzzle, Activity, Gauge, Infinity, Diamond, Crown, Compass, PieChart,
  Workflow, Ship, Truck, HardHat, Sticker, Scaling, Component
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl, getUserColor, getInitials } from '../utils/avatarHelper';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

// Premium icon set - clean and professional meta-data
const PREMIUM_ICONS = [
  { name: 'Folder', icon: Folder },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Target', icon: Target },
  { name: 'Rocket', icon: Rocket },
  { name: 'Star', icon: Star },
  { name: 'Zap', icon: Zap },
  { name: 'Users', icon: Users },
  { name: 'BarChart', icon: BarChart },
  { name: 'Calendar', icon: Calendar },
  { name: 'Globe', icon: Globe },
  { name: 'Shield', icon: Shield },
  { name: 'Code', icon: Code },
  { name: 'Cpu', icon: Cpu },
  { name: 'Database', icon: Database },
  { name: 'Layout', icon: Layout },
  { name: 'Layers', icon: Layers },
  { name: 'Box', icon: Box },
  { name: 'Cpu', icon: Chip },
  { name: 'HardDrive', icon: HardDrive },
  { name: 'Network', icon: Network },
  { name: 'GitBranch', icon: GitBranch },
  { name: 'Puzzle', icon: Puzzle },
  { name: 'Activity', icon: Activity },
  { name: 'Gauge', icon: Gauge },
  { name: 'Infinity', icon: Infinity },
  { name: 'Diamond', icon: Diamond },
  { name: 'Crown', icon: Crown },
  { name: 'Compass', icon: Compass },
  { name: 'PieChart', icon: PieChart },
  { name: 'Workflow', icon: Workflow },
  { name: 'Ship', icon: Ship },
  { name: 'Truck', icon: Truck },
  { name: 'HardHat', icon: HardHat },
  { name: 'Sticker', icon: Sticker },
  { name: 'Scaling', icon: Scaling },
  { name: 'Component', icon: Component }
];

const NewProjectModal = ({ isOpen, onClose, initialData = null }) => {
  const { user } = useAuth();
  const { createProject, updateProject, departments, fetchDepartments, users } = useData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Folder',
    color: '#0086c0',
    department: '',
    isPrivate: false,
    memberIds: []
  });

  const isEditing = !!initialData;

  const prevOpenRef = React.useRef(false);

  // Reset or Fill form when modal opens
  React.useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      if (initialData) {
        // Find department ID if missing but name exists (legacy support)
        let deptId = initialData.departmentId;
        if (!deptId && initialData.department && departments.length > 0) {
          const dept = departments.find(d => d.name === initialData.department);
          if (dept) deptId = dept.id;
        }

        setFormData({
          name: initialData.name || '',
          icon: initialData.icon || 'Folder',
          color: initialData.color || '#0086c0',
          department: deptId || '',
          isPrivate: initialData.isPrivate || false,
          memberIds: initialData.members?.map(m => m.userId) || []
        });
      } else {
        setFormData({
          name: '',
          icon: 'Folder',
          color: '#0086c0',
          department: '',
          isPrivate: false,
          memberIds: []
        });
      }
      fetchDepartments();
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialData, fetchDepartments, departments]);

  // Available departments for user
  const availableDepartments = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return departments;
    const userDeptList = user?.departments || [];
    if (user?.department) userDeptList.push(user.department);
    return departments.filter(d => {
      const dId = d.id;
      return userDeptList.some(ud => ud == dId || ud === d.name);
    });
  }, [departments, user]);

  // Auto-select first department for new projects
  React.useEffect(() => {
    if (isOpen && !isEditing && availableDepartments.length === 1 && !formData.department) {
      const deptId = availableDepartments[0].id;
      setFormData(prev => ({ ...prev, department: deptId }));
    }
  }, [isOpen, isEditing, availableDepartments, formData.department]);

  const colors = ['#0086c0', '#6366f1', '#8b5cf6', '#00c875', '#fdab3d', '#e2445c', '#ff5a5f'];

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.warning('Lütfen proje adı giriniz.');
      return;
    }

    if (!isEditing && !formData.department && availableDepartments.length > 0) {
      toast.warning('Lütfen bir çalışma alanı seçiniz.');
      return;
    }

    setLoading(true);

    const projId = isEditing ? parseInt(initialData.id, 10) : 0;

    const payload = {
      id: projId,
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      isPrivate: false,
      departmentId: parseInt(formData.department, 10) || (isEditing ? initialData.departmentId : 0),

    };

    let result;
    if (isEditing) {
      result = await updateProject(projId, payload);
    } else {
      result = await createProject(payload);
    }

    setLoading(false);

    if (result.success) {
      onClose();
      toast.success(isEditing ? 'Proje güncellendi' : 'Proje oluşturuldu');
      if (!isEditing && result.data && result.data.id) {
        navigate(`/board/${result.data.id}`);
      }
    } else {
      console.error("Operation failed:", result.error);
      toast.error('İşlem başarısız oldu');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Projeyi Düzenle' : 'Yeni Proje'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Project Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Proje Adı *
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Proje adını girin"
              required
              className="mt-1.5"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">İkon</Label>
            <div className="mt-2 grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
              {PREMIUM_ICONS.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
                  className={`w-11 h-11 flex items-center justify-center rounded-lg transition-all duration-300 relative group
                    ${formData.icon === name
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={formData.icon === name ? 1.8 : 1.4}
                    className={`transition-all ${formData.icon === name ? 'text-indigo-600' : 'text-gray-400 dark:text-gray-500'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Renk</Label>
            <div className="flex gap-2 mt-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-9 h-9 rounded-xl transition-all hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : ''
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Workspace Selection */}
          <div>
            <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Çalışma Alanı {!isEditing && '*'}
            </Label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={isEditing}
              className="mt-1.5 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Çalışma Alanı Seçin</option>
              {availableDepartments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>





          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? 'İşleniyor...' : (isEditing ? 'Güncelle' : 'Oluştur')}
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
