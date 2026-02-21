import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, Loader2, CheckSquare, Users, BarChart2, Zap, Eye, EyeOff, X, Heart } from 'lucide-react';
import UniTaskLogo, { GridMark } from '../components/ui/UniTaskLogo';
import TrueFocus from '../components/react-bits/TrueFocus';
import GradientText from '../components/react-bits/GradientText';
import DotGrid from '../components/react-bits/DotGrid';

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
  const location = useLocation();

  const featureCards = [
    { icon: <CheckSquare size={18} className="text-indigo-400" />, title: 'Task Tracking', desc: 'Real-time visibility on every task' },
    { icon: <Users size={18} className="text-violet-400" />, title: 'Team Collaboration', desc: 'Work in sync across departments' },
    { icon: <BarChart2 size={18} className="text-emerald-400" />, title: 'Analytics', desc: 'Actionable insights from your data' },
    { icon: <Zap size={18} className="text-amber-400" />, title: 'Automation', desc: 'Eliminate repetitive manual work' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate "premium" smooth loading
    await new Promise(r => setTimeout(r, 600));

    const result = await login(email, password);

    if (result.success) {
      toast.success("Welcome back to UniTask! 🚀");
      
      // Check for redirect destination (include query params)
      const from = location.state?.from ? 
        (location.state.from.pathname + location.state.from.search) : 
        '/';
      setTimeout(() => navigate(from, { replace: true }), 500);
    } else {
      toast.error(result.error || "Authentication failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden font-sans">
      {/* LEFT SIDE - BRANDING */}
      <div
        className="hidden lg:flex w-1/2 relative flex-col justify-center items-center p-14 overflow-hidden"
        style={{ background: '#080818' }}
      >
        {/* Radial gradient glows — corners only */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: [
            'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(99,60,230,0.15) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 40% at 100% 100%, rgba(139,92,246,0.12) 0%, transparent 70%)',
          ].join(', ')
        }} />

        {/* Dot Grid Background */}
        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
           <DotGrid
             dotSize={4}
             gap={24}
             baseColor="rgba(255,255,255,0.05)"
             activeColor="#818cf8"
             proximity={150}
             shockRadius={200}
             shockStrength={8}
             className="opacity-60"
           />
        </div>

        {/* MIDDLE: Full logo + headline + 2×2 grid */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg w-full max-h-screen overflow-y-auto scrollbar-hide py-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex flex-col items-center w-full my-auto"
          >
            {/* Logo */}
            <div className="mb-6 xl:mb-10 scale-100 xl:scale-110 shrink-0">
              <UniTaskLogo size="lg" variant="full-dark" />
            </div>

            {/* Headline with TrueFocus */}
            <div className="mb-4 xl:mb-6 relative h-[120px] 2xl:h-[180px] w-full flex items-center justify-center shrink-0">
               <TrueFocus 
                 sentence="Manage|Progress|Together."
                 separator="|"
                 manualMode={false}
                 blurAmount={6}
                 borderColor="#818cf8"
                 animationDuration={0.8}
                 pauseBetweenAnimations={1.5}
               />
            </div>



            {/* 2×2 Feature card grid */}
            <div className="grid grid-cols-2 gap-3 xl:gap-4 w-full shrink-0">
              {featureCards.map(card => (
                <div
                  key={card.title}
                  className="group flex flex-col items-center text-center"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px',
                    padding: '20px 16px',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(4px)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <div className="mb-3 p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                    {card.icon}
                  </div>
                  <div className="mb-1">
                    <GradientText
                      colors={['#A78BFA', '#818CF8', '#C4B5FD', '#A78BFA']}
                      animationSpeed={6}
                      showBorder={false}
                      className="font-bold text-sm"
                    >
                      {card.title}
                    </GradientText>
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(199,193,255,0.5)', lineHeight: 1.4 }}>{card.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="w-full max-w-sm space-y-8 relative z-10">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <GridMark size="lg" />
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
                    tabIndex={1}
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
                      className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all"
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
                    tabIndex={2}
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
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
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
