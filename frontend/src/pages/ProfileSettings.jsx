import React, { useState } from 'react';
import { Camera, Save, Lock, User as UserIcon, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { toast } from '../components/ui/sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { getAvatarUrl } from '../utils/avatarHelper';

const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    color: user?.color || '',
    // SaaS & Billing Fields
    companyName: user?.companyName || '',
    taxOffice: user?.taxOffice || '',
    taxNumber: user?.taxNumber || '',
    billingAddress: user?.billingAddress || ''
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('[ProfileSettings] Updating profile with payload:', profileForm);
      const response = await authAPI.updateProfile(profileForm);
      console.log('[ProfileSettings] Update response:', response.data);
      updateUser(response.data);
      toast.success('Profil güncellendi!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message;
      toast.error('Profil güncellenemedi: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      toast.success('Şifre başarıyla değiştirildi');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Şifre değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Dosya boyutu 5MB\'dan büyük olamaz.');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const { fileAPI } = await import('../services/api');
        const response = await fileAPI.uploadAvatar(formData);

        // Backend returns relative path: /uploads/avatars/xyz.jpg
        const avatarUrl = response.data.url;

        setProfileForm({ ...profileForm, avatar: avatarUrl });
        toast.success('Avatar yüklendi. Değişikliği uygulamak için "Kaydet" butonuna basın.');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Avatar yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 overflow-auto relative">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ayarlar</h1>
          <p className="text-gray-600 dark:text-gray-400">Profil bilgilerinizi ve ayarlarınızı yönetin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-2 flex flex-row md:flex-col overflow-x-auto gap-2 scrollbar-hide">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-auto md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-lg transition-colors whitespace-nowrap shrink-0 ${activeTab === 'profile'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <UserIcon size={18} className="shrink-0" />
                <span>Profil</span>
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`w-auto md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-lg transition-colors whitespace-nowrap shrink-0 ${activeTab === 'password'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <Lock size={18} className="shrink-0" />
                <span>Şifre</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profil Bilgileri</h2>

                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={getAvatarUrl(profileForm.avatar, null, profileForm.fullName, profileForm.color)} />
                        <AvatarFallback
                          className="text-white text-2xl font-bold"
                          style={{ backgroundColor: profileForm.color || '#6366f1' }}
                        >
                          {profileForm.fullName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                        <Camera size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{profileForm.fullName}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{profileForm.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Rol: <span className="font-medium capitalize">{user?.role}</span>
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <div className="flex items-center gap-2">
                          <UserIcon size={16} />
                          Ad Soyad
                        </div>
                      </label>
                      <input
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          Email
                        </div>
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Avatar URL (opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={profileForm.avatar}
                        onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        placeholder="https://..."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Veya yukarıdaki kamera ikonundan dosya yükleyin
                      </p>
                    </div>

                    {/* Fatura & SaaS Bilgileri */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fatura Bilgileri (Opsiyonel)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Firma Adı</label>
                          <input
                            type="text"
                            value={profileForm.companyName}
                            onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                            placeholder="Örn: Acme A.Ş."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vergi Dairesi</label>
                          <input
                            type="text"
                            value={profileForm.taxOffice}
                            onChange={(e) => setProfileForm({ ...profileForm, taxOffice: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vergi / TC Kimlik No</label>
                          <input
                            type="text"
                            value={profileForm.taxNumber}
                            onChange={(e) => setProfileForm({ ...profileForm, taxNumber: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Açık Fatura Adresi</label>
                          <input
                            type="text"
                            value={profileForm.billingAddress}
                            onChange={(e) => setProfileForm({ ...profileForm, billingAddress: e.target.value })}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        <Save size={18} />
                        {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Şifre Değiştir</h2>

                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mevcut Şifre
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Yeni Şifre
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Yeni Şifre (Tekrar)
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        <Lock size={18} />
                        {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
