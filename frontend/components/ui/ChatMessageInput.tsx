import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';

interface ChatMessageInputProps {
    onSend: (message: string) => void;
    isDark: boolean
}

const ChatMessageInput = ({ onSend, isDark }: ChatMessageInputProps) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText('');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View className='flex-row items-center -px-3 -py-2 border border-background-dark rounded-2xl mx-3 mb-3 dark:border-background-light'>
                
                {/* Camara */}
                {!text && (
                    <TouchableOpacity className="p-2 mr-1">
                        <Ionicons name='camera' size={24} color={ isDark ? "#FAFAFA" : '#000000'} />
                    </TouchableOpacity>
                )}

                {/* Input */}
                <TextInput
                    className='flex-1 px-2 text-base max-h-24 dark:text-background-light'
                    placeholder='Escribe un mensaje...'
                    placeholderTextColor={`${isDark ? '#aaa' : '#182240'}`}
                    value={text}
                    onChangeText={setText}
                    multiline
                />

                {/* Imagen*/}
                {!text && (
                    <TouchableOpacity className='p-2 ml-1'>
                        <Ionicons name='image' size={24} color={ isDark ? "#FAFAFA" : '#000000'} />
                    </TouchableOpacity>
                )}

                {/* Enviar */}
                {text.trim() && (
                    <TouchableOpacity className="p-2 ml-1" onPress={handleSend}>
                        <Ionicons name='send' size={24} color={ isDark ? "#FAFAFA" : '#000000'} />
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

export default ChatMessageInput;