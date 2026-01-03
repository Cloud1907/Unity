import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
    const handleLogout = () => {
        router.replace('/auth/login');
    };

    return (
        <View className="flex-1 items-center justify-center bg-slate-50 p-6">
            <View className="w-24 h-24 bg-indigo-100 rounded-full items-center justify-center mb-6">
                <Text className="text-4xl">👨‍💻</Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900">Melih Bulut</Text>
            <Text className="text-slate-500 mb-8">melih.bulut@4flow.com</Text>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-50 w-full py-4 rounded-xl border border-red-100"
            >
                <Text className="text-red-600 font-bold text-center">Logout</Text>
            </TouchableOpacity>
        </View>
    );
}
