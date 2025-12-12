import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, departmentsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/sonner';
import { Users, Building2, Shield, Plus, Trash2, Edit } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await usersAPI.getAll();
        setUsers(response.data);
      } else if (activeTab === 'departments') {
        const response = await departmentsAPI.getAll();
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Veri yüklenirken hata oluştu');
    }
    setLoading(false);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'guest':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      manager: 'Yönetici',
      member: 'Üye',
      guest: 'Misafir'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Ayarlar</h1>
          <p className="text-sm text-gray-500 mt-1">Kullanıcıları ve departmanları yönetin</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'text-[#6366f1] border-b-2 border-[#6366f1]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={18} />
            Kullanıcılar
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('departments')}
              className={`pb-3 px-1 font-medium transition-all flex items-center gap-2 ${
                activeTab === 'departments'
                  ? 'text-[#6366f1] border-b-2 border-[#6366f1]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 size={18} />
              Departmanlar
            </button>
          )}
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-1 font-medium transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'text-[#6366f1] border-b-2 border-[#6366f1]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield size={18} />
            Profil
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]"></div>
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Kullanıcılar</h2>
                    <p className="text-sm text-gray-500 mt-1">Tüm kullanıcıları görüntüleyin</p>
                  </div>
                  {user?.role === 'admin' && (
                    <Button className="bg-[#6366f1] hover:bg-[#5558e3] gap-2">
                      <Plus size={18} />
                      Yeni Kullanıcı
                    </Button>
                  )}
                </div>
                <div className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <div key={u._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={u.avatar} alt={u.fullName} />
                          <AvatarFallback style={{ backgroundColor: u.color }}>
                            {u.fullName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{u.fullName}</h3>
                            <Badge className={getRoleBadgeColor(u.role)}>
                              {getRoleLabel(u.role)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      {user?.role === 'admin' && u._id !== user._id && (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Edit size={16} />
                            Düzenle
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                            <Trash2 size={16} />
                            Sil
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Departments Tab */}
            {activeTab === 'departments' && user?.role === 'admin' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Departmanlar</h2>
                    <p className="text-sm text-gray-500 mt-1">Departmanları yönetin</p>
                  </div>
                  <Button className="bg-[#6366f1] hover:bg-[#5558e3] gap-2">
                    <Plus size={18} />
                    Yeni Departman
                  </Button>
                </div>
                <div className="divide-y divide-gray-200">
                  {departments.map((dept) => (
                    <div key={dept._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: dept.color || '#6366f1' }}
                        >
                          <Building2 className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{dept.name}</h3>
                          <p className="text-sm text-gray-500">{dept.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Edit size={16} />
                          Düzenle
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                          <Trash2 size={16} />
                          Sil
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profil Bilgileri</h2>
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user?.avatar} alt={user?.fullName} />
                      <AvatarFallback style={{ backgroundColor: user?.color }}>
                        {user?.fullName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline">Avatar Değiştir</Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="fullName">Ad Soyad</Label>
                    <Input
                      id="fullName"
                      defaultValue={user?.fullName}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>

                  <div>
                    <Label>Rol</Label>
                    <div className="mt-2">
                      <Badge className={getRoleBadgeColor(user?.role)}>
                        {getRoleLabel(user?.role)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="bg-[#6366f1] hover:bg-[#5558e3]">
                      Değişiklikleri Kaydet
                    </Button>
                    <Button variant="outline">
                      İptal
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;
