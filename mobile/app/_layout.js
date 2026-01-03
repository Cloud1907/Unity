import '../global.css';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="auto" />
            <Slot />
        </View>
    );
}
