import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import StarryBackground from '../components/ui/StarryBackground';
import { Lock, Mail, ArrowRight, Loader2, Hexagon, Star, Zap, Shield, Heart, Users, TrendingUp, Eye, EyeOff, X } from 'lucide-react';

const ForgotPasswordModal = ({ onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // Smooth UX

    const result = await onSubmit(email);
    setLoading(false);

    if (result.success) {
      setSent(true);
      toast.success('Şifre sıfırlama talimatları gönderildi.');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Şifrenizi mi unuttunuz?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Kayıtlı e-posta adresinizi girin, size yeni bir şifre gönderelim.
            </p>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400 animate-bounce">
                <Mail size={32} />
              </div>
              <p className="text-slate-900 dark:text-white font-medium">E-posta Gönderildi!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                Lütfen gelen kutunuzu kontrol edin.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Giriş'e Dön
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white"
                    placeholder="ornek@sirket.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Şifre Sıfırla'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();

  // Premium feature slides
  const slides = [
    { icon: <Users size={40} className="text-indigo-400" />, title: "Orchestrate Your Workforce", desc: "Align your team's potential with strategic goals using intelligent resource management." },
    { icon: <TrendingUp size={40} className="text-emerald-400" />, title: "Data-Driven Insights", desc: "Transform raw activity into actionable intelligence to optimize operational efficiency." },
    { icon: <Shield size={40} className="text-purple-400" />, title: "Enterprise-Grade Security", desc: "Your ecosystem is guarded with advanced protocols and compliance standards." }
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate "premium" smooth loading
    await new Promise(r => setTimeout(r, 600));

    const result = await login(email, password);

    if (result.success) {
      toast.success("Welcome back to Unity! 🚀");
      setTimeout(() => navigate('/'), 500);
    } else {
      toast.error(result.error || "Authentication failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden font-sans">
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0B0F19] flex-col justify-center items-center text-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-60">
          <StarryBackground />
        </div>

        {/* Decorative Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/40 via-transparent to-purple-900/40 pointer-events-none" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]"
        />

        {/* Main Brand Content */}
        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30"
              />
              <div className="w-32 h-32 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 transform rotate-3 hover:rotate-6 transition-transform duration-500">
                <Hexagon size={64} className="text-white fill-white/10" strokeWidth={1.5} />
              </div>
            </div>
          </motion.div>

          <h1 className="text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Manage the Future with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Unity</span>.
          </h1>

          <div className="mb-8 text-2xl font-bold tracking-tight text-indigo-200/90">
            Univera Task Management
          </div>

          {/* Carousel */}
          <div className="h-32 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col items-center"
              >
                <div className="mb-2 p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
                  {slides[currentSlide].icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{slides[currentSlide].title}</h3>
                <p className="text-indigo-200">{slides[currentSlide].desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicators */}
          <div className="flex gap-2 justify-center mt-8">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-indigo-500' : 'bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-sm space-y-8 relative z-10">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Hexagon className="text-white w-8 h-8 fill-white/20" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Hoş Geldiniz!</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
              Hesabınıza erişmek için bilgilerinizi girin.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                  Email veya Kullanıcı Adı
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                    placeholder="ornek@sirket.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                    Şifre
                  </label>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      Şifremi unuttum?
                    </button>
                  </div>
                </div>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <span className="flex items-center">
                    Giriş Yap
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Signature */}
          <div className="pt-12 flex justify-center items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-slate-300 dark:text-slate-600 capitalize">
            <span>Created by</span>
            <span className="text-slate-400 dark:text-slate-500 hover:text-indigo-400 transition-colors cursor-default">Univera AI Team</span>
            <Heart size={8} className="text-red-400/50" />
          </div>


        </div>
      </div>


      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <ForgotPasswordModal onClose={() => setShowForgotModal(false)} onSubmit={forgotPassword} />
        )}
      </AnimatePresence>
    </div >
  );
};

export default Login;
