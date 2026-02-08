import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { Camera, User, Mail, Lock, Save, X, Upload, Settings as SettingsIcon, Bell, Shield, Palette, Venus, Mars, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/sonner';
import api, { authAPI } from '../services/api';
import { getAvatarUrl } from '../utils/avatarHelper';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { users } = useData();
  const { theme, setThemeMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    location: user?.location || '',
    gender: user?.gender || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'account', label: 'Hesap', icon: SettingsIcon },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'security', label: 'Güvenlik', icon: Shield },
    { id: 'appearance', label: 'Görünüm', icon: Palette }
  ];

  // Avatar seçimi için color palette (Hex codes to avoid backend length issues)
  const avatarColors = [
    { bg: '#3b82f6', name: 'Mavi', class: 'bg-blue-500' },
    { bg: '#8b5cf6', name: 'Mor', class: 'bg-purple-500' },
    { bg: '#10b981', name: 'Yeşil', class: 'bg-emerald-500' },
    { bg: '#f97316', name: 'Turuncu', class: 'bg-orange-500' },
    { bg: '#eab308', name: 'Sarı', class: 'bg-yellow-500' },
    { bg: '#ef4444', name: 'Kırmızı', class: 'bg-red-500' },
    { bg: '#6b7280', name: 'Gri', class: 'bg-gray-500' },
    { bg: '#06b6d4', name: 'Cyan', class: 'bg-cyan-500' }
  ];

  const handleColorSelect = (color) => {
    setFormData({ ...formData, color: color.bg });

    // Immediate Preview Update
    // We explicitly regenerate the URL with the NEW color to show it immediately
    // Remove # for Dicebear API
    const cleanColor = color.bg.replace('#', '');
    const seed = formData.fullName || user?.fullName || 'User';
    const newAvatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=${cleanColor}`;
    setAvatarPreview(newAvatarUrl);

    toast.info(`${color.name} renk seçildi`);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // User requested 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Dosya boyutu çok büyük (Maksimum 5MB)');
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // "Resolution Fix": Resize to high-quality but manageable dimensions (max 512px)
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 512;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Use JPEG with 0.8 quality for excellent balance between looks and size
            const base64String = canvas.toDataURL('image/jpeg', 0.85);
            setAvatarPreview(base64String);
            setFormData(prev => ({ ...prev, avatar: base64String }));
            toast.success('Avatar optimize edildi! Kaydetmeyi unutmayın.');
          };
          img.src = event.target.result;
        };
        reader.onerror = () => {
          toast.error('Dosya okuma hatası.');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Avatar processing error:', error);
        toast.error('Avatar işlenemedi.');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updateData = {
        fullName: formData.fullName,
        avatar: formData.avatar || avatarPreview || user?.avatar,
        color: formData.color || user?.color,
        gender: formData.gender
      };

      // DEBUG: Sending profile update
      const response = await authAPI.updateProfile(updateData);

      if (response.data) {
        updateUser(response.data);
        toast.success('Profil başarıyla güncellendi!');
      } else {
        // Fallback: merge with current user if response body is empty
        updateUser({ ...user, ...updateData });
        toast.success('Profil güncellendi!');
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenemedi: ' + (error.response?.data?.detail || error.message));
    }
  };

  const generateNewAvatar = () => {
    // Standard professional seeds for a "Global Site" look
    // Using Initials collection for a clean, corporate style
    let seed = user?.fullName || 'User';
    const newAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    setAvatarPreview(newAvatar);
    setFormData({ ...formData, avatar: newAvatar });
    toast.success('Profesyonel avatar oluşturuldu! Kaydetmeyi unutmayın.');
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı!');
      return;
    }

    try {
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success('Şifre başarıyla değiştirildi!');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.detail || 'Şifre değiştirilemedi');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ayarlar</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Profil ve hesap ayarlarını yönetin</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <X size={16} className="mr-2" />
              Kapat
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Tabs */}
          <div className="col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                      ? 'bg-[#6366f1] text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profil Bilgileri</h2>
                    <Button
                      onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                      className="bg-[#6366f1] hover:bg-[#5558e3]"
                    >
                      {isEditing ? <><Save size={16} className="mr-2" /> Kaydet</> : 'Düzenle'}
                    </Button>
                  </div>

                  {/* Avatar Section */}
                  <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                          <AvatarImage
                            src={getAvatarUrl(avatarPreview || user?.avatar, user?.gender, user?.fullName, user?.color)}
                          />
                          <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-400">
                            {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                          <label className="absolute -bottom-2 -right-2 p-2 bg-[#6366f1] text-white rounded-full cursor-pointer hover:bg-[#5558e3] shadow-lg transition-all">
                            <Camera size={16} />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarUpload}
                            />
                          </label>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.fullName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Üye olma tarihi: {user?.createdAt && user.createdAt !== '0001-01-01T00:00:00' && !isNaN(new Date(user.createdAt).getTime()) ? new Date(user.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                        </p>

                        {isEditing && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Avatar Rengi Seç:</p>
                              <div className="flex gap-2 flex-wrap">
                                {avatarColors.map((color, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleColorSelect(color)}
                                    className={`w-10 h-10 rounded-full ${color.class} hover:scale-110 transition-transform border-2 ${formData.color === color.bg ? 'border-blue-500 scale-110 shadow-lg' : 'border-white shadow-md'}`}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={generateNewAvatar}
                              className="text-xs h-8"
                            >
                              <RefreshCw size={14} className="mr-2" />
                              Yerele Göre Avatar Yenile
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="space-y-6">
                    {/* Gender Selection Removed per User Request */}

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="fullName">Ad Soyad</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">E-posta</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="+90 555 555 55 55"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Konum</Label>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="İstanbul, Türkiye"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Hakkında</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Kendinizden kısaca bahsedin..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="p-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Hesap Ayarları</h2>

                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Mail size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">E-posta Adresi</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user?.email}</p>
                          <Button variant="outline" size="sm" className="mt-3">
                            E-posta Değiştir
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Shield size={20} className="text-gray-600 dark:text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Hesap Tipi</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium text-xs">
                              {user?.role || 'Kullanıcı'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t dark:border-gray-800 pt-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-red-600 dark:text-red-400">Tehlikeli Bölge</h3>
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-gray-700 mb-3">
                          Hesabınızı kalıcı olarak silmek isterseniz, bu işlem geri alınamaz.
                        </p>
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          Hesabı Sil
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Güvenlik</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Şifre Değiştir</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">Yeni Şifre</Label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                        <Button onClick={handleChangePassword} className="bg-[#6366f1] hover:bg-[#5558e3]">
                          <Lock size={16} className="mr-2" />
                          Şifreyi Güncelle
                        </Button>
                      </div>
                    </div>

                    <div className="border-t dark:border-gray-800 pt-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">İki Faktörlü Kimlik Doğrulama</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Hesabınıza ekstra bir güvenlik katmanı ekleyin.
                      </p>
                      <Button variant="outline">
                        2FA'yı Etkinleştir
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Bildirim Tercihleri</h2>

                  <div className="space-y-4">
                    {[
                      { label: 'E-posta Bildirimleri', desc: 'Önemli güncellemeler için e-posta alın' },
                      { label: 'Görev Bildirimleri', desc: 'Size atanan görevler için bildirim alın' },
                      { label: 'Yorum Bildirimleri', desc: 'Görevlerinize yapılan yorumlar için bildirim' },
                      { label: 'Proje Bildirimleri', desc: 'Projelerinizle ilgili güncellemeler' },
                      { label: 'Haftalık Özet', desc: 'Haftalık aktivite özeti e-postası' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.label}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={idx < 3} />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366f1]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="p-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Görünüm</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Tema</h3>

                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'light', label: 'Açık', bg: 'bg-white border border-gray-300' },
                          { id: 'dark', label: 'Koyu', bg: 'bg-gray-800' },
                          { id: 'system', label: 'Sistem', bg: 'bg-gradient-to-br from-white to-gray-800' }
                        ].map((themeOption) => (
                          <button
                            key={themeOption.id}
                            onClick={() => {
                              setThemeMode(themeOption.id);
                              toast.success(`${themeOption.label} tema seçildi`);
                            }}
                            className={`p-4 border-2 rounded-lg transition-colors hover:border-blue-400 ${theme === themeOption.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                              }`}
                          >
                            <div className="text-center">
                              <div className={`w-full h-20 rounded mb-2 ${themeOption.bg}`} />
                              <p className="text-sm font-medium dark:text-gray-100">{themeOption.label}</p>
                              {theme === themeOption.id && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 block">✓ Aktif</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Dil</h3>
                      <select className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100">
                        <option>Türkçe</option>
                        <option>English</option>
                        <option>Deutsch</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
