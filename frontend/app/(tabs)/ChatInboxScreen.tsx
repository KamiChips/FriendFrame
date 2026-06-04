import { ScrollView, StatusBar, Text, View, useColorScheme, TouchableOpacity } from "react-native";
import '../../global.css';
import ChatCard from "@/components/ui/ChatCard";
import FriendframeHeader from "@/components/ui/FriendframeHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons'; 
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import ChatScreen from '../ChatScreen';
import { Chat } from '../../services/supabase/chat/chat.types';
import { getConversations } from "@/services/supabase/chat/chat.conversation";

const ChatInboxScreen = () => {

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        getConversations();
    }, [user]);
    

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
            profilePic: 'https://i.pinimg.com/736x/66/86/ae/6686ae04340f0125502a1fc08bf482da.jpg'
        },
    ];

    return (
        <SafeAreaView className={`flex-1 bg-background-light ${isDark ? 'dark' : ''} dark:bg-background-semidark `} >
            <StatusBar 
                barStyle={isDark ? 'light-content' : 'dark-content'} 
                backgroundColor={isDark ? '#1a1a1a' : "#fafafa"}
            />

            {/* Header */}
            <FriendframeHeader isDark={isDark} />

            {/* Inbox */}
            <View className="flex-1 bg-gray-50 dark:bg-background-dark">
                
                {/* --- HEADER DE MENSAJES CON BOTÓN DE CREAR GRUPO --- */}
                <View className="flex-row justify-between items-center px-4 pt-5 pb-3">
                    <Text className="font-spartan-bold text-2xl text-[#1a1a1a] dark:text-background-light">
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