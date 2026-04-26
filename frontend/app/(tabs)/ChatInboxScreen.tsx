import { ScrollView, StatusBar, Text, Image, View, useColorScheme, TouchableOpacity } from "react-native";
import '../../global.css';
import ChatCard from "@/components/ui/ChatCard";

const ChatInboxScreen = () => {

    const colorScheme = useColorScheme();
    const isDark = false;
    // colorScheme === 'dark';

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
        <View className="flex-1 bg-background-gray mt-2">
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View className="flex-row items-center justify-between bg-background-light px-5 pb-3 pt-4">
                <Text className="font-bold text-2xl italic tracking-wider">FriendFrame</Text>
                <TouchableOpacity>
                    <Image 
                        source={require('../../assets/images/notification-bell.png')} 
                    />
                </TouchableOpacity>
            </View>

            {/* Inbox */}
            <View className="flex-1 bg-gray-50">
                <View className="px-4 pt-5 pb-3">
                    <Text className="font-bold text-2xl text-[#1a1a1a]">
                        Mensajes
                    </Text>
                </View>

                <ScrollView className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Chats */}
                    {CHATS.map(chat => (
                        <ChatCard key={chat.id} {...chat} />
                    ))}
                </ScrollView>
            </View>
        </View>
    )
}

export default ChatInboxScreen
