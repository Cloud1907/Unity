import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Bell, Search, Plus, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react-native';

export default function DashboardScreen() {
    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-slate-100">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-indigo-600 rounded-full items-center justify-center">
                        <Text className="text-white font-bold">MB</Text>
                    </View>
                    <View className="ml-3">
                        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Hoş Geldin,</Text>
                        <Text className="text-slate-900 font-bold">Melih Bulut</Text>
                    </View>
                </View>
                <View className="flex-row gap-4">
                    <TouchableOpacity className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                        <Search size={20} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                        <Bell size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                {/* Welcome Section */}
                <View className="mt-8 mb-6">
                    <Text className="text-3xl font-black text-slate-900 tracking-tight">4Flow Dashboard</Text>
                    <Text className="text-slate-500 font-medium mt-1">İşte bugün odaklanman gerekenler.</Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity className="bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-indigo-200 mb-8">
                    <Plus size={20} color="white" className="mr-2" />
                    <Text className="text-white font-bold text-lg">Yeni Görev Oluştur</Text>
                </TouchableOpacity>

                {/* Summary Stats */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-8 -mx-6 px-6">
                    <View className="bg-white p-6 rounded-3xl border border-slate-100 w-44 mr-4 shadow-sm">
                        <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mb-4">
                            <Clock size={20} color="#4f46e5" />
                        </View>
                        <Text className="text-3xl font-bold text-slate-900">12</Text>
                        <Text className="text-slate-500 font-semibold mt-1">Aktif Görev</Text>
                    </View>

                    <View className="bg-white p-6 rounded-3xl border border-slate-100 w-44 mr-4 shadow-sm">
                        <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center mb-4">
                            <ArrowUpRight size={20} color="#f59e0b" />
                        </View>
                        <Text className="text-3xl font-bold text-slate-900">4</Text>
                        <Text className="text-slate-500 font-semibold mt-1">Acil Bekleyen</Text>
                    </View>

                    <View className="bg-white p-6 rounded-3xl border border-slate-100 w-44 shadow-sm">
                        <View className="w-10 h-10 bg-emerald-50 rounded-xl items-center justify-center mb-4">
                            <CheckCircle2 size={20} color="#10b981" />
                        </View>
                        <Text className="text-3xl font-bold text-slate-900">85%</Text>
                        <Text className="text-slate-500 font-semibold mt-1">Tamamlanma</Text>
                    </View>
                </ScrollView>

                {/* Ongoing Tasks Title */}
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-slate-900">Devam Edenler</Text>
                    <TouchableOpacity>
                        <Text className="text-indigo-600 font-bold">Hepsini Gör</Text>
                    </TouchableOpacity>
                </View>

                {/* Task Preview List */}
                <View className="space-y-4 mb-8">
                    {[1, 2, 3].map((item) => (
                        <View key={item} className="bg-white p-5 rounded-2xl border border-slate-100 flex-row items-center shadow-sm">
                            <View className="w-2 h-12 bg-indigo-500 rounded-full mr-4" />
                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-lg">Mobil Uygulama Tasarımı</Text>
                                <View className="flex-row items-center mt-1">
                                    <Text className="text-slate-400 text-xs font-medium">Dashboard Tasarımı • </Text>
                                    <Text className="text-indigo-600 text-xs font-bold">Devam Ediyor</Text>
                                </View>
                            </View>
                            <ArrowUpRight size={20} color="#cbd5e1" />
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
