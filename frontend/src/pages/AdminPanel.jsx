import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, User as UserIcon, Tag, Check, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { usersAPI, labelsAPI } from '../services/api';
import { toast } from '../components/ui/sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

const AdminPanel = () => {
  const { users, projects, fetchUsers, departments, fetchDepartments, createDepartment, updateDepartment, deleteDepartment } = useData();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'departments', 'labels'
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals & Confirm Logs
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Department state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptDeleteConfirm, setDeptDeleteConfirm] = useState(null);

  // Labels state - Global labels removed as they are now project-specific

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [fetchUsers, fetchDepartments]);


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredDepts = departments.filter(dept =>
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleDelete = async (userId) => {
    try {
      await usersAPI.delete(userId);
      toast.success('Kullanıcı silindi');
      fetchUsers();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Kullanıcı silinemedi');
    }
  };

  const handleDeleteDept = async (deptId) => {
    const result = await deleteDepartment(deptId);
    if (result.success) {
      setDeptDeleteConfirm(null);
    }
  };


  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-red-100', text: 'text-red-700', label: 'Admin', icon: <Shield size={12} /> },
      member: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Üye', icon: <UserIcon size={12} /> }
    };
    const badge = badges[role] || badges.member;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getUserDepartments = (user) => {
    if (user.departments && user.departments.length > 0) {
      // Map IDs/Names to readable names
      return user.departments.map(deptIdOrName => {
        // Flexible match for string vs number
        const dept = departments.find(d => (d._id || d.id) == deptIdOrName || d.name === deptIdOrName);
        return dept ? dept.name : null;
      })
        .filter(name => name !== null) // Filter out orphans (deleted depts)
        .join(', ');
    }
    const singleDept = departments.find(d => d._id === user.department || d.id === user.department);
    return singleDept?.name || user.department || '-';
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 p-6 overflow-auto relative text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Admin Panel</h1>
            <p className="text-gray-600 dark:text-gray-400">Sistem yapılandırmasını ve kaynakları yönetin</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl w-fit">
            {[
              { id: 'users', label: 'Kullanıcılar' },
              { id: 'departments', label: 'Çalışma Alanları' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={`${activeTab === 'users' ? "Kullanıcı" : activeTab === 'departments' ? "Çalışma Alanı" : "Etiket"} ara...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Filters & Add Buttons */}
            <div className="flex gap-2">
              {activeTab === 'users' && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">Tüm Roller</option>
                  <option value="admin">Yönetici (Admin)</option>
                  <option value="member">Üye (Member)</option>
                </select>
              )}

              <button
                onClick={() => {
                  if (activeTab === 'users') setIsAddModalOpen(true);
                  else if (activeTab === 'departments') setIsDeptModalOpen(true);
                  else setIsLabelModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
              >
                <Plus size={18} />
                {activeTab === 'users' ? 'Yeni Kullanıcı' : activeTab === 'departments' ? 'Yeni Çalışma Alanı' : 'Yeni Etiket'}
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Kullanıcı</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Rol</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Çalışma Alanları</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map(user => (
                    <tr key={user._id || user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={
                                user.avatar?.startsWith('http')
                                  ? user.avatar
                                  : `http://localhost:7000${user.avatar || ''}`
                              }
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white dark:text-gray-100 font-bold">
                              {user.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.id || user._id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{user.email}</td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{getUserDepartments(user)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">Kullanıcı bulunamadı</p>
                </div>
              )}
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Admin</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Üye</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.filter(u => u.role === 'member').length}</p>
              </div>
            </div>
          </>
        ) : activeTab === 'departments' ? (
          <>
            {/* Departments Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Çalışma Alanı Adı</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Yönetici</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Açıklama</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Kullanıcı Sayısı</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDepts.map(dept => (
                    <tr key={dept._id || dept.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: dept.color || '#6366f1' }}
                          />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{dept.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{dept.headOfDepartment || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm truncate max-w-xs">{dept.description || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {users.filter(u => u.departments?.includes(dept.name) || u.department === dept.name).length} Kişi
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedDept(dept);
                              setIsDeptModalOpen(true);
                            }}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeptDeleteConfirm(dept)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDepts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">Çalışma alanı bulunamadı</p>
                </div>
              )}
            </div>

            {/* Dept Stats */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>İpucu:</strong> Çalışma Alanları, kullanıcıların gruplandırılmasını sağlar. Bir kullanıcı birden fazla çalışma alanında bulunabilir.
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* User Modals */}
      {
        isAddModalOpen && (
          <UserFormModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={fetchUsers}
            projects={projects}
          />
        )
      }

      {
        isEditModalOpen && selectedUser && (
          <UserFormModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
            onSuccess={fetchUsers}
            user={selectedUser}
            projects={projects}
          />
        )
      }

      {/* Dept Modal */}
      {
        isDeptModalOpen && (
          <DepartmentFormModal
            isOpen={isDeptModalOpen}
            onClose={() => {
              setIsDeptModalOpen(false);
              setSelectedDept(null);
            }}
            onSuccess={fetchDepartments}
            dept={selectedDept}
          />
        )
      }


      {/* Delete Confirmation Dialogs */}
      {
        deleteConfirm && (
          <ConfirmModal
            isOpen={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => handleDelete(deleteConfirm._id || deleteConfirm.id)}
            title="Kullanıcıyı Sil"
            message={`${deleteConfirm.fullName} kullanıcısını silmek istediğinizden emin misiniz?`}
          />
        )
      }

      {
        deptDeleteConfirm && (
          <ConfirmModal
            isOpen={!!deptDeleteConfirm}
            onClose={() => setDeptDeleteConfirm(null)}
            onConfirm={() => handleDeleteDept(deptDeleteConfirm._id || deptDeleteConfirm.id)}
            title="Çalışma Alanını Sil"
            message={`${deptDeleteConfirm.name} çalışma alanını silmek istediğinizden emin misiniz?`}
          />
        )
      }

    </div >
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">İptal</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Sil</button>
        </div>
      </div>
    </div>
  );
}

// Department Form Modal Component
const DepartmentFormModal = ({ isOpen, onClose, onSuccess, dept = null }) => {
  const { createDepartment, updateDepartment } = useData();
  const [formData, setFormData] = useState({
    name: dept?.name || '',
    description: dept?.description || '',
    headOfDepartment: dept?.headOfDepartment || '',
    color: dept?.color || '#6366f1',
    isMaster: dept?.isMaster || false
  });
  const [loading, setLoading] = useState(false);

  const colors = ['#0086c0', '#6366f1', '#8b5cf6', '#00c875', '#fdab3d', '#e2445c', '#ff5a5f'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (dept) {
        await updateDepartment(dept._id || dept.id, formData);
      } else {
        await createDepartment(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Dept Error:', error);
      const msg = error.response?.data?.detail || error.message;
      toast.error('Hata: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {dept ? 'Çalışma Alanını Düzenle' : 'Yeni Çalışma Alanı Ekle'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Çalışma Alanı Adı</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              placeholder="Örn: Mühendislik"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Çalışma Alanı Yöneticisi</label>
            <input
              type="text"
              value={formData.headOfDepartment}
              onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              placeholder="Örn: Melih Bulut"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Çalışma alanı hakkında kısa bilgi..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isMaster"
              checked={formData.isMaster}
              onChange={(e) => setFormData({ ...formData, isMaster: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isMaster" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Master Çalışma Alanı (Admin yetkisiyle açılan ana grup)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Renk Seçin</label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

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
              {loading ? 'Kaydediliyor...' : dept ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// User Form Modal Component (UPDATED FOR MULTI-DEPARTMENT)
const UserFormModal = ({ isOpen, onClose, onSuccess, user = null, projects = [] }) => {
  const { departments } = useData();
  const getUserDepartments = () => {
    if (!user) return [];
    if (user.departments) return user.departments;
    if (user.department) return [user.department];
    return [];
  };

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'member',
    avatar: user?.avatar || '',
    departments: getUserDepartments()
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = user?._id || user?.id;
      // We need to send departments as list.

      const payload = {
        id: userId, // Required for backend validation
        ...formData,
        department: null, // Ensure legacy field is cleared or ignored
      };

      // If updating usage and password is not provided/empty, remove it from payload
      if (user && !payload.password) {
        delete payload.password;
      }

      console.log('Sending user update payload:', payload);

      if (user) {
        // Update existing user
        await usersAPI.update(userId, payload);
        toast.success('Kullanıcı güncellendi');
      } else {
        // Create new user
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

          {/* Departments Multi-Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Çalışma Alanları (Çoklu Seçim)</label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg p-3 space-y-4">

              {/* Master Workspaces Group */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Shield size={10} /> Master Çalışma Alanları
                </h4>
                <div className="space-y-1">
                  {departments.filter(d => d.isMaster).map(dept => {
                    const deptId = dept._id || dept.id;
                    const isChecked = formData.departments.includes(deptId) || formData.departments.includes(dept.name);
                    return (
                      <label key={deptId} className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-900/50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDepartment(deptId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color || '#6366f1' }} />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{dept.name}</span>
                      </label>
                    );
                  })}
                  {departments.filter(d => d.isMaster).length === 0 && <p className="text-xs text-gray-400 italic px-2">Master alan yok</p>}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700"></div>

              {/* Dynamic Workspaces Group */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Diğer Çalışma Alanları</h4>
                <div className="space-y-1">
                  {departments.filter(d => !d.isMaster).map(dept => {
                    const deptId = dept._id || dept.id;
                    const isChecked = formData.departments.includes(deptId) || formData.departments.includes(dept.name);
                    return (
                      <label key={deptId} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDepartment(deptId)}
                          className="rounded border-gray-300"
                        />
                        <div className="w-2 h-2 rounded-full opacity-70" style={{ backgroundColor: dept.color || '#6366f1' }} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{dept.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
            <p className="text-xs text-gray-500 mt-2">
              Seçilen: {
                formData.departments.map(d => {
                  const dp = departments.find(x => (x._id || x.id) === d || x.name === d);
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

// Label Modal
const LabelFormModal = ({ isOpen, onClose, onSuccess, label = null }) => {
  const { createLabel } = useData();
  const [formData, setFormData] = useState({
    name: label?.name || '',
    color: label?.color || '#00c875',
    isGlobal: true,
    projectId: null
  });
  const [loading, setLoading] = useState(false);

  const colors = ['#00c875', '#e2445c', '#fdab3d', '#0086c0', '#579bfc', '#a25ddc', '#ff5a5f'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (label) {
        await labelsAPI.update(label.id || label._id, formData);
      } else {
        await labelsAPI.create(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Labels error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {label ? 'Etiketi Düzenle (Global)' : 'Yeni Global Etiket'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etiket Adı</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Renk</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg">İptal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg">{loading ? '...' : 'Kaydet'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
