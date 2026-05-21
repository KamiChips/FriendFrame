import React from 'react';
import { View, Text, useColorScheme } from 'react-native';

interface Message {
  system?: boolean;
  user?: string;
  text: string;
  senderId?: string;
  isDark?: boolean;
}

interface ChatBubbleProps {
  message: Message;
  currentUser: string;
}

export default function ChatBubble({ message, currentUser }: ChatBubbleProps) {
  const isMe = message.senderId === currentUser;
  
  const colorScheme = useColorScheme();
  const isDark = message.isDark ?? colorScheme === 'dark';

  if (message.system) {
    return (
      <View className="items-center mb-3 mt-1">
        <Text className={`italic text-center text-xs ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
          {message.text}
        </Text>
      </View>
    );
  }

  return (
    // Mantiene la alineación: a la derecha si soy yo (isMe), a la izquierda si es el otro usuario
    <View className={`flex-row ${isMe ? "justify-end" : "justify-start"} mb-3 px-2`}>
      <View
        className={`
            max-w-[75%]
            px-4 py-2
            shadow-sm
            ${isMe 
                ? `rounded-full border-2 ${
                    isDark 
                    ? "bg-primary-dark border-background-semidark" 
                    : "bg-secondary-dark/90 border-background-light"
                }` 
                : `rounded-2xl ${
                    isDark 
                    ? "bg-background-semidark text-zinc-100" 
                    : "bg-gray-300" 
                }`
            }
            `}
      >
        {/* Renderiza el nombre ÚNICAMENTE si es el otro usuario */}
        {!isMe && message.user && (
          <Text className={`text-xs font-semibold mb-1 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
            {message.user}
          </Text>
        )}

        <Text 
          className={`text-sm ${
            isMe 
              ? "text-white" 
              : (isDark ? "text-zinc-100" : "text-gray-800")
          }`}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}