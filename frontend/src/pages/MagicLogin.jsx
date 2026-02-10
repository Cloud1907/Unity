import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

const MagicLogin = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const loginAttempted = React.useRef(false);
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            toast.error("Geçersiz giriş linki.");
            navigate('/login');
            return;
        }

        if (loginAttempted.current) return;
        loginAttempted.current = true;

        const verifyMagicLink = async () => {
            try {
                console.log("[MagicLogin] Verifying token:", token);
                // Do NOT clear localStorage before API call!
                // Clearing it causes a race condition: background requests (from DataContext etc.)
                // detect no token, interceptor finds no refreshToken, and redirects to /login.

                const response = await api.post('/auth/magic-login', { token });
                console.log("[MagicLogin] Response:", response.data);

                const data = response.data;
                const finalToken = data.accessToken || data.AccessToken;
                const finalUser = data.user || data.User;
                const finalTarget = data.targetUrl || data.TargetUrl;

                if (finalToken && finalUser) {
                    // NOW it's safe to clear and replace
                    localStorage.setItem('token', finalToken);
                    localStorage.setItem('user', JSON.stringify(finalUser));
                    
                    // Update context
                    await updateUser(finalUser);
                    console.log("[MagicLogin] Context updated. Redirecting to:", finalTarget);
                    
                    toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");
                    
                    // Immediate redirect, no delay for speed
                    navigate(finalTarget || '/', { replace: true });
                } else {
                    throw new Error("Geçersiz sunucu yanıtı: Token veya Kullanıcı eksik.");
                }
            } catch (error) {
                console.error("[MagicLogin] Failed:", error);
                const message = error.response?.data?.message || "Giriş yapılamadı.";
                console.log("[MagicLogin] Error Detail:", error.response?.data);
                
                toast.error(message);
                // If token is invalid/expired, we MUST redirect to login
                // But let's verify if it's actually 401 from interceptor or our own catch
                navigate('/login', { replace: true });
            }
        };

        verifyMagicLink();
    }, [token, navigate, updateUser]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Giriş yapılıyor...</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Lütfen bekleyin, sizi yönlendiriyoruz.</p>
        </div>
    );
};

export default MagicLogin;
