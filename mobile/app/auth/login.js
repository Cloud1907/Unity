import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';

// Use localhost for iOS Simulator / Web. 
// For Android Emulator, typically 'http://10.0.2.2:8000/api' is needed.
// Since user is testing on Web/macOS, localhost is fine.
const API_URL = 'http://localhost:8000/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert("Please enter both email and password");
            return;
        }

        setIsLoading(true);
        try {
            console.log(`Attempting login to ${API_URL}/auth/login with`, email);

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Login failed");
            }

            console.log("Login successful:", data);

            // Navigate to dashboard 
            // Note: We haven't built dashboard yet, so staying here or going home
            alert(`Welcome ${data.user ? data.user.fullName || data.user.email : 'back'}!`);
            // router.replace('/dashboard'); 

        } catch (error) {
            console.error("Login Error:", error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <View className="flex-1 px-8 justify-center">
                {/* Header Section */}
                <View className="items-center mb-12">
                    <View className="w-20 h-20 bg-indigo-600 rounded-3xl items-center justify-center mb-6 shadow-xl shadow-indigo-200 rotation-3">
                        <Text className="text-4xl">🌊</Text>
                    </View>
                    <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</Text>
                    <Text className="text-slate-500 mt-2 font-medium">Sign in to continue to 4Flow</Text>
                </View>

                {/* Form Section */}
                <View className="space-y-4">
                    <View>
                        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email</Text>
                        <TextInput
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:border-indigo-500 focus:bg-white"
                            placeholder="melih@4flow.com"
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!isLoading}
                        />
                    </View>

                    <View>
                        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</Text>
                        <TextInput
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:border-indigo-500 focus:bg-white"
                            placeholder="••••••••"
                            placeholderTextColor="#94a3b8"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!isLoading}
                        />
                    </View>

                    <TouchableOpacity className="items-end">
                        <Text className="text-indigo-600 font-semibold text-sm">Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        className={`bg-indigo-600 w-full py-4 rounded-xl shadow-lg shadow-indigo-200 mt-4 active:scale-95 transition-transform ${isLoading ? 'opacity-70' : ''}`}
                    >
                        <Text className="text-white font-bold text-center text-lg">
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View className="flex-row justify-center mt-8 gap-1">
                    <Text className="text-slate-500 font-medium">Don't have an account?</Text>
                    <Link href="/auth/register" asChild>
                        <TouchableOpacity>
                            <Text className="text-indigo-600 font-bold">Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
