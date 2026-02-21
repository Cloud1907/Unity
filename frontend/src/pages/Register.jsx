import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from '../components/ui/sonner';
import { User, UserRound } from 'lucide-react';
import UniTaskLogo from '../components/ui/UniTaskLogo';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGenderSelect = (gender) => {
    setFormData({
      ...formData,
      gender: gender
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır!');
      return;
    }

    if (!formData.gender) {
      toast.error('Lütfen cinsiyet seçiniz!');
      return;
    }

    setLoading(true);

    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      gender: formData.gender,
      role: 'member'
    });

    if (result.success) {
      toast.success('Kayıt başarılı!');
      navigate('/');
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <UniTaskLogo size="lg" variant="full" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Projenizi yönetin, görevlerinizi takip edin.</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Kayıt Ol</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Ahmet Yılmaz"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@4flow.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            {/* Gender Selection */}
            <div>
              <Label>Cinsiyet</Label>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleGenderSelect('male')}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${formData.gender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <div className={`p-3 rounded-full ${formData.gender === 'male' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                    <User size={24} />
                  </div>
                  <span className="text-sm font-medium">Erkek</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenderSelect('female')}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${formData.gender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <div className={`p-3 rounded-full ${formData.gender === 'female' ? 'bg-pink-100' : 'bg-gray-100'
                    }`}>
                    <UserRound size={24} />
                  </div>
                  <span className="text-sm font-medium">Kadın</span>
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#6366f1] hover:bg-[#5558e3]"
              disabled={loading}
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız var mı?{' '}
              <Link to="/login" className="text-[#6366f1] hover:underline font-medium">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
