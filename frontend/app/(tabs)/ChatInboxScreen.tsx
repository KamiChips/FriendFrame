import { ScrollView, StatusBar, Text, View, useColorScheme, TouchableOpacity } from "react-native";
import '../../global.css';
import ChatCard from "@/components/ui/ChatCard";
import HeaderWithLogoAndNotificationBell from "@/components/ui/HeaderWithLogoAndNotificationBell";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons'; 

const ChatInboxScreen = () => {

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // chats de prueba
    const CHATS = [
        {
            id: 1,
            initials: 'CR',
            name: 'Carlos Ramírez',
            message: 'Claro! Nos vemos mañana',
            time: 'hace 10 min',
            unread: true,
        },
        {
            id: 2,
            initials: 'AL',
            name: 'Ana López',
            message: 'Gracias por la recomendación!',
            time: 'hace 2 horas',
            unread: false,
        },
    ];

    return (
        <SafeAreaView className={`flex-1 bg-background-gray ${isDark ? 'dark' : ''} dark:bg-background-semidark `} >
            <StatusBar 
                barStyle={isDark ? 'light-content' : 'dark-content'} 
                backgroundColor={isDark ? '#1a1a1a' : "#ffffff"}
            />

            {/* Header */}
            <HeaderWithLogoAndNotificationBell isDark={isDark} />

            {/* Inbox */}
            <View className="flex-1 bg-gray-50 dark:bg-background-dark">
                
                {/* --- HEADER DE MENSAJES CON BOTÓN DE CREAR GRUPO --- */}
                <View className="flex-row justify-between items-center px-4 pt-5 pb-3">
                    <Text className="font-bold text-2xl text-[#1a1a1a] dark:text-background-light">
                        Mensajes
                    </Text>

                    {/* Link para abrir el modal transparente */}
                    <Link href="/CreateGroup" asChild>
                        <TouchableOpacity className="p-1">
                            <Ionicons 
                                name="people-outline" 
                                size={28} 
                                color={isDark ? "#FF9B42" : "#30C2D9"} 
                            />
                        </TouchableOpacity>
                    </Link>
                </View>

                <ScrollView className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Chats */}
                    {CHATS.map(chat => (
                        <ChatCard key={chat.id} {...chat} isDark={isDark} />
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

export default ChatInboxScreen;