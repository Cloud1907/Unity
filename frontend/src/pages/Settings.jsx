import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { Camera, User, Mail, Lock, Save, X, Upload, Settings as SettingsIcon, Bell, Shield, Palette } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/sonner';

const Settings = () => {
  const { user } = useAuth();
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

  // Avatar seçimi için color palette
  const avatarColors = [
    { bg: 'from-blue-500 to-indigo-600', name: 'Mavi' },
    { bg: 'from-purple-500 to-pink-600', name: 'Mor' },
    { bg: 'from-green-500 to-teal-600', name: 'Yeşil' },
    { bg: 'from-orange-500 to-red-600', name: 'Turuncu' },
    { bg: 'from-yellow-500 to-orange-600', name: 'Sarı' },
    { bg: 'from-pink-500 to-rose-600', name: 'Pembe' },
    { bg: 'from-gray-600 to-gray-800', name: 'Gri' },
    { bg: 'from-cyan-500 to-blue-600', name: 'Cyan' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        toast.success('Avatar yüklendi!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // Profil güncelleme API çağrısı burada yapılacak
    toast.success('Profil güncellendi!');
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı!');
      return;
    }
    // Şifre değiştirme API çağrısı
    toast.success('Şifre başarıyla değiştirildi!');
    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
              <p className="text-sm text-gray-500 mt-1">Profil ve hesap ayarlarını yönetin</p>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#6366f1] text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-900">Profil Bilgileri</h2>
                    <Button
                      onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                      className="bg-[#6366f1] hover:bg-[#5558e3]"
                    >
                      {isEditing ? <><Save size={16} className="mr-2" /> Kaydet</> : 'Düzenle'}
                    </Button>
                  </div>

                  {/* Avatar Section */}
                  <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                          <AvatarImage src={avatarPreview || user?.avatar} />
                          <AvatarFallback className="text-2xl">
                            {user?.fullName?.charAt(0) || 'K'}
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
                        <h3 className="text-lg font-semibold text-gray-900">{user?.fullName}</h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <p className="text-xs text-gray-400 mt-2">Üye olma tarihi: {new Date(user?.createdAt).toLocaleDateString('tr-TR')}</p>
                        
                        {isEditing && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Avatar Rengi Seç:</p>
                            <div className="flex gap-2 flex-wrap">
                              {avatarColors.map((color, idx) => (
                                <button
                                  key={idx}
                                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${color.bg} hover:scale-110 transition-transform border-2 border-white shadow-md`}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="space-y-6">
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
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Hesap Ayarları</h2>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Mail size={20} className="text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">E-posta Adresi</h3>
                          <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                          <Button variant="outline" size="sm" className="mt-3">
                            E-posta Değiştir
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Shield size={20} className="text-gray-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Hesap Tipi</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium text-xs">
                              {user?.role || 'Kullanıcı'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-gray-900 mb-4 text-red-600">Tehlikeli Bölge</h3>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Güvenlik</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Şifre Değiştir</h3>
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

                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-gray-900 mb-4">İki Faktörlü Kimlik Doğrulama</h3>
                      <p className="text-sm text-gray-600 mb-4">
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
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Bildirim Tercihleri</h2>
                  
                  <div className="space-y-4">
                    {[
                      { label: 'E-posta Bildirimleri', desc: 'Önemli güncellemeler için e-posta alın' },
                      { label: 'Görev Bildirimleri', desc: 'Size atanan görevler için bildirim alın' },
                      { label: 'Yorum Bildirimleri', desc: 'Görevlerinize yapılan yorumlar için bildirim' },
                      { label: 'Proje Bildirimleri', desc: 'Projelerinizle ilgili güncellemeler' },
                      { label: 'Haftalık Özet', desc: 'Haftalık aktivite özeti e-postası' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.label}</h4>
                          <p className="text-sm text-gray-500">{item.desc}</p>
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
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Görünüm</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Tema</h3>
                      
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
                            className={`p-4 border-2 rounded-lg transition-colors hover:border-blue-400 ${
                              theme === themeOption.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="text-center">
                              <div className={`w-full h-20 rounded mb-2 ${themeOption.bg}`} />
                              <p className="text-sm font-medium">{themeOption.label}</p>
                              {theme === themeOption.id && (
                                <span className="text-xs text-blue-600 font-semibold mt-1 block">✓ Aktif</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Dil</h3>
                      <select className="w-full p-2 border border-gray-300 rounded-lg">
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
