import ChatHeader from "@/components/ui/ChatHeader";
import ChatMessage from "@/components/ui/ChatMessage";
import ChatMessageInput from "@/components/ui/ChatMessageInput";
import { useRef, useState } from "react";
import { View, useColorScheme, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MESSAGES = [
    {
        id: 1,
        message: "Hola trabalenguas, dime un trabalenguas",
        time: "1:28 pm",
        sender: "me",
    },
    {
        id: 2,
        message: "Hay que volvernos expertos en el valo",
        time: "1:28 pm",
        sender: "other",
    },
    {
        id: 3,
        message: "Al final nunca sacamos el apex, ahi esta empolvado",
        time: "1:28 pm",
        sender: "other",
    },
    {
        id: 4,
        message: "Que haremos desde las 5 am hasta las 4pm con maletas?",
        time: "1:28 pm",
        sender: "me",
    },
    {
        id: 5,
        message: "n0 sE M3 Ocur3E N4d0ta",
        time: "1:28 pm",
        sender: "other",
    },
    {
        id: 6,
        message: "Si",
        time: "1:28 pm",
        sender: "me",
    },
];

const ChatScreen = () => {
    const isDark = false;
    // useColorScheme() === 'dark';
    const [messages, setMessages] = useState([...MESSAGES]);
    const scrollViewRef = useRef<ScrollView>(null);

    const HEADER_PROPS = {
        isDark: isDark,
        username: "ElNito7",
        initials: "AR",
        lastActive: "Ahorita",
    }

    const onSend = (text: string) => {
        const newMessage = {
            id: messages.length + 1,
            message: text,
            time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            sender: "me"
        };
        setMessages(prev => [...prev, newMessage]);
    }
    
    return (
        <SafeAreaView className="flex-1 bg-background-light">
            <StatusBar 
                barStyle={isDark ? 'light-content' : 'dark-content'} 
                backgroundColor={isDark ? '#1a1a1a' : "#ffffff"}
            />
            <ChatHeader {...HEADER_PROPS}/>

            <View className="flex-1 bg-gray-50 pt-5 pb-3">
                <ScrollView 
                    className="flex-1"
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Chats */}
                    {messages.map(m => (
                        <ChatMessage key={m.id} {...m} />
                    ))}
                </ScrollView>
            </View>
            
            <ChatMessageInput onSend={onSend} isDark={isDark} />
        </SafeAreaView>
    );
}

export default ChatScreen;
