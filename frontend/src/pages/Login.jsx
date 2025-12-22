import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from '../components/ui/sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Giriş başarılı!');
      navigate('/');
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/4flow-text-logo.png"
              alt="4Flow"
              className="h-16 w-auto"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Proje ve Görev Yönetimi</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors duration-200">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Giriş Yap</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="dark:text-gray-200">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@4flow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="password" className="dark:text-gray-200">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#6366f1] hover:bg-[#5558e3] text-white"
              disabled={loading}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="text-[#6366f1] hover:underline font-medium">
                Kayıt Ol
              </Link>
            </p>
          </div>
        </div>

        {/* Version Badge */}
        <div className="absolute bottom-4 right-4">
          <span className="text-xs text-gray-400 font-mono bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded shadow">
            v1.2.2
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
