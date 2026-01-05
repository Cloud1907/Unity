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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 font-sans">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden min-h-[500px]">
        {/* Left Side - Brand */}
        <div className="w-1/2 bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-12 border-r border-gray-100 dark:border-gray-700">
          <div className="mb-6">
            <img
              src="/unity-logo-3d.png"
              alt="Unity"
              className="w-48 h-auto object-contain"
            />
          </div>
          <h1 className="text-[#1e1b4b] dark:text-white text-5xl font-bold mb-2 tracking-tight">Unity</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Proje ve Görev Yönetimi</p>
        </div>

        {/* Right Side - Form */}
        <div className="w-1/2 p-12 flex flex-col justify-center bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Giriş Yap</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email.adresiniz@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all pr-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Giriş yapamadın mı?</a>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#3758f9] hover:bg-[#2f4ac4] text-white font-medium rounded-lg text-base shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
              disabled={loading}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Görev dünyası sağlar?
            </p>
          </div>
        </div>
      </div>
      {/* Version Badge */}
      <div className="absolute bottom-4 right-4">
        <span className="text-xs text-gray-400 font-mono">
          v1.2.2
        </span>
      </div>
    </div>
  );
};

export default Login;
