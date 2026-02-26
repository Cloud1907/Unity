import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { usersAPI } from '../../services/api';
import { toast } from '../ui/sonner';

// User Form Modal Component (UPDATED FOR MULTI-DEPARTMENT)
const UserFormModal = ({ isOpen, onClose, onSuccess, user = null, projects = [] }) => {
  const { departments } = useData();
  const backdropRef = React.useRef(null);
  const isMouseDownOnBackdrop = React.useRef(false);

  const getUserDepartments = () => {
    if (!user) return [];
    
    // Scenario 1: We have IDs (e.g. from standard UserDto)
    if (user.departments && user.departments.length > 0 && typeof user.departments[0] === 'number') {
      return user.departments;
    }

    // Scenario 2: Admin DTO with Names
    if (user.departmentNames) {
      return user.departmentNames
        .map(name => {
          const d = departments.find(dept => dept.name === name);
          return d ? d.id : null;
        })
        .filter(id => id !== null);
    }
    
    // Scenario 3: Legacy single department string
    if (user.department) {
       const d = departments.find(dept => dept.name === user.department);
       return d ? [d.id] : [];
    }
    
    return [];
  };

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'member',
    avatar: user?.avatar || '',
    departments: getUserDepartments(),
    // SaaS Fields
    companyName: user?.companyName || '',
    taxOffice: user?.taxOffice || '',
    taxNumber: user?.taxNumber || '',
    billingAddress: user?.billingAddress || '',
    subscriptionPlan: user?.subscriptionPlan || ''
  });
  const [loading, setLoading] = useState(false);

  const handleMouseDown = (e) => {
    if (e.target === backdropRef.current) isMouseDownOnBackdrop.current = true;
    else isMouseDownOnBackdrop.current = false;
  };

  const handleMouseUp = (e) => {
    if (isMouseDownOnBackdrop.current && e.target === backdropRef.current) onClose();
    isMouseDownOnBackdrop.current = false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = user?.id;

      const { departments, ...restData } = formData;

      const payload = {
        id: userId, // Required for backend validation
        ...restData,
        department: null, // Ensure legacy field is cleared or ignored
      };

      // If updating usage and password is not provided/empty, remove it from payload
      if (user && !payload.password) {
        delete payload.password;
      }

      if (user) {
        // PUT Request: Update existing user
        // Backend expects 'User' entity structure: List<UserDepartment>
        // Transform [1, 2] -> [{ departmentId: 1 }, { departmentId: 2 }]
        payload.departments = departments
          .map(id => parseInt(id))
          .filter(id => !isNaN(id))
          .map(id => ({ departmentId: id }));

        await usersAPI.update(userId, payload);
        toast.success('Kullanıcı güncellendi');
      } else {
        // POST Request: Create new user
        // Backend expects 'CreateUserRequest' DTO: List<int>
        payload.departments = departments
          .map(id => parseInt(id))
          .filter(id => !isNaN(id));

        const response = await usersAPI.create(payload);
        toast.success('Kullanıcı oluşturuldu');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('User action error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data || (user ? 'Kullanıcı güncellenemedi' : 'Kullanıcı oluşturulamadı');
      toast.error(typeof errorMsg === 'string' ? errorMsg : (user ? 'Kullanıcı güncellenemedi' : 'Kullanıcı oluşturulamadı'));
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptName) => {
    setFormData(prev => {
      const current = prev.departments || [];
      if (current.includes(deptName)) {
        return { ...prev, departments: current.filter(d => d !== deptName) };
      } else {
        return { ...prev, departments: [...current, deptName] };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {user ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Password Field - Optional for existing users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {user ? 'Şifre (Değiştirmek için doldurun)' : 'Şifre'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              required={!user}
              placeholder={user ? "********" : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            >
              <option value="admin">Yönetici (Admin)</option>
              <option value="member">Üye (Member)</option>
            </select>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Fatura & SaaS Bilgileri (Opsiyonel)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Firma Adı</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
                  placeholder="Firma ünvanı"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Abonelik Planı</label>
                <select
                  value={formData.subscriptionPlan}
                  onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">Seçiniz</option>
                  <option value="Free">Yavaş - Kurucu</option>
                  <option value="Pro">Pro - Profesyonel</option>
                  <option value="Enterprise">Kurumsal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vergi Dairesi</label>
                <input
                  type="text"
                  value={formData.taxOffice}
                  onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vergi / TC No</label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Açık Adres</label>
                <input
                  type="text"
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Departments Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Çalışma Alanları (Çoklu Seçim)</label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg p-3 space-y-1">
              {departments
                .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                .map(dept => {
                const deptId = dept.id;
                const isChecked = formData.departments.includes(deptId) || formData.departments.includes(dept.name);
                return (
                  <label key={deptId} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDepartment(deptId)}
                      className="rounded border-gray-300"
                    />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color || '#6366f1' }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{dept.name}</span>
                  </label>
                );
              })}
              {departments.length === 0 && <p className="text-xs text-gray-400 italic px-2">Çalışma alanı yok</p>}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Seçilen: {
                formData.departments.map(d => {
                  const dp = departments.find(x => x.id === d || x.name === d);
                  return dp ? dp.name : d;
                }).join(', ') || 'Hiçbiri'
              }
            </p>
          </div>

          {/* Avatar alanı kaldırıldı - Avatar sadece Ayarlar sayfasından değiştirilmeli */}

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : user ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
