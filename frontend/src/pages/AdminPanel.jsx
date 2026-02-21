import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, User as UserIcon, Tag, Check, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { usersAPI, labelsAPI } from '../services/api';
import { toast } from '../components/ui/sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { getAvatarUrl } from '../utils/avatarHelper';
import ConfirmModal from '../components/ui/ConfirmModal';
import DepartmentFormModal from '../components/modals/DepartmentFormModal';
import UserFormModal from '../components/modals/UserFormModal';

const AdminPanel = () => {
  const { users, projects, departments, fetchDepartments, createDepartment, updateDepartment, deleteDepartment, fetchUsers } = useData();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'departments', 'labels'
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Admin-specific state: users with department NAMES
  const [adminUsers, setAdminUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, adminCount: 0, memberCount: 0 });

  // Modals & Confirm Logs
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Department state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false); // Added missing state
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptDeleteConfirm, setDeptDeleteConfirm] = useState(null);

  // Labels state - Global labels removed as they are now project-specific

  /* 
   * FIX: Removed hardcoded localhost:8080.
   * Now uses usersAPI from services which handles BaseURL dynamically.
   */
  // 1. Define fetchAdminUsers with useCallback for stability
  const fetchAdminUsers = React.useCallback(async () => {
    // Only fetch if on users tab
    if (activeTab !== 'users') return;

    try {
      const response = await usersAPI.getAdminUsers(searchTerm, roleFilter);
      const data = response.data;

      setAdminUsers(data.users);
      setStats({
        totalUsers: data.totalUsers,
        adminCount: data.adminCount,
        memberCount: data.memberCount
      });
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
      toast.error('Kullanıcı listesi güncellenemedi.');
    }
  }, [activeTab, searchTerm, roleFilter]); // Dependencies for fetch

  // 2. Trigger fetch on dependencies change (Debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAdminUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchAdminUsers]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);


  // Server-side filtered users are directly in adminUsers
  const filteredUsers = adminUsers;

  const filteredDepts = departments.filter(dept =>
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleDelete = async (userId) => {
    try {
      await usersAPI.delete(userId);
      toast.success('Kullanıcı silindi');

      // Refresh admin users using the same API service
      const response = await usersAPI.getAdminUsers(searchTerm, roleFilter);
      const data = response.data;

      setAdminUsers(data.users);
      setStats({
        totalUsers: data.totalUsers,
        adminCount: data.adminCount,
        memberCount: data.memberCount
      });
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete failed:', error);
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
      admin: { bg: 'bg-red-100', text: 'text-red-700', label: 'Yönetici', icon: <Shield size={12} /> },
      member: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Üye', icon: <UserIcon size={12} /> }
    };
    const badge = badges[role] || badges.member;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  // This function is no longer needed as adminUsers will already contain department names
  // const getUserDepartments = (user) => {
  //   if (user.departments && user.departments.length > 0) {
  //     // Map IDs/Names to readable names using allDepartments
  //     return user.departments.map(deptIdOrName => {
  //       // Flexible match for string vs number
  //       const dept = allDepartments.find(d => d.id == deptIdOrName || d.name === deptIdOrName);
  //       return dept ? dept.name : null;
  //     })
  //       .filter(name => name !== null) // Filter out orphans (deleted depts)
  //       .join(', ');
  //   }
  //   const singleDept = allDepartments.find(d => d.id === user.department);
  //   return singleDept?.name || user.department || '-';
  // };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 p-6 overflow-auto relative text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Admin Panel</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">Sistem yapılandırmasını ve kaynakları yönetin</p>
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
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder={`${activeTab === 'users' ? "Kullanıcı" : activeTab === 'departments' ? "Çalışma Alanı" : "Etiket"} ara...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              />
            </div>

            {/* Filters & Add Buttons */}
            <div className="flex gap-2">
              {activeTab === 'users' && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium text-gray-700 dark:text-gray-300"
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
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-bold whitespace-nowrap"
              >
                <Plus size={14} />
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
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kullanıcı</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Çalışma Alanları</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-8 h-8 border border-gray-100 dark:border-gray-700">
                            <AvatarImage
                              src={user.avatar ? getAvatarUrl(user.avatar) : ''}
                            />
                            <AvatarFallback
                              className="font-bold text-white text-[10px]"
                              style={{ backgroundColor: user.color || '#6366f1' }}
                            >
                              {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{user.fullName}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300">{user.email}</td>
                      <td className="px-4 py-2.5">{getRoleBadge(user.role)}</td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-sm">{user.departmentNames?.join(', ') || '-'}</td>
                      <td className="px-4 py-2.5">
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
                <p className="text-2xl text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Yönetici</p>
                <p className="text-2xl text-red-600 dark:text-red-400">{stats.adminCount}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Üye</p>
                <p className="text-2xl text-blue-600 dark:text-blue-400">{stats.memberCount}</p>
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
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Çalışma Alanı Adı</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yönetici</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Üyeler</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDepts.map(dept => {
                    const deptMembers = users.filter(u =>
                      u.departments?.includes(dept.id) ||
                      u.departments?.includes(dept.name) ||
                      u.department === dept.name
                    );

                    return (
                      <tr key={dept.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: dept.color || '#6366f1' }}
                            />
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{dept.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300">{dept.headOfDepartment || '-'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            {deptMembers.length > 0 ? (
                              <>
                                <div className="flex -space-x-2">
                                  {deptMembers.slice(0, 5).map(member => (
                                    <Avatar key={member.id} className="w-6 h-6 border-2 border-white dark:border-gray-800" title={member.fullName}>
                                      <AvatarImage src={member.avatar ? getAvatarUrl(member.avatar) : ''} />
                                      <AvatarFallback
                                        className="text-[8px] text-white font-bold"
                                        style={{ backgroundColor: member.color || '#6366f1' }}
                                      >
                                        {member.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                </div>
                                {deptMembers.length > 5 && (
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2">
                                    +{deptMembers.length - 5}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">
                                  ({deptMembers.length} kişi)
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic">Üye yok</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
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
                    );
                  })}
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
            onSuccess={fetchAdminUsers}
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
            onSuccess={fetchAdminUsers}
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
            onConfirm={() => handleDelete(deleteConfirm.id)}
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
            onConfirm={() => handleDeleteDept(deptDeleteConfirm.id)}
            title="Çalışma Alanını Sil"
            message={`${deptDeleteConfirm.name} çalışma alanını silmek istediğinizden emin misiniz?`}
          />
        )
      }

    </div >
  );
};



export default AdminPanel;
