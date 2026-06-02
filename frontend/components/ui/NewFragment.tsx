import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView, KeyboardAvoidingView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProfileIcon from './ProfileIcon';

interface NewFragmentProps {
    isVisible: boolean;
    onClose: () => void;
    onPublish: (text: string) => void;
}

export function NewFragment({ isVisible, onClose, onPublish }: NewFragmentProps) {
    const [text, setText] = useState('');
    const maxChars = 280;
    
    const handlePublish = () => {
        if (text.trim().length > 0) {
            onPublish(text);
        }
    };

    return (
        <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <View className="flex-1 justify-end">
                        <TouchableOpacity onPress={onClose} className="p-1">
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        <View className="flex-row items-center space-x-1">
                            <Ionicons name="sparkles" size={18} color="#f97316" />
                            <Text className="text-lg font-bold text-orange-500"> 
                                Nuevo <Text className="text-lg font-bold text-cyan-600"> Fragment </Text>
                            </Text>
                        </View>

                        <TouchableOpacity onPress={handlePublish} disabled={text.length === 0} className={text.length === 0 ? 'opacity-50' : 'opacity-100'}>
                            <LinearGradient
                                colors={['#06b6d4', '#f97316']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="px-4 py-2 rounded-full"
                            >
                                <Text className="font-semibold text-gray-700">Publicar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                        {/* User Info */}
                        <View className="flex-row items-center mb-5">
                            <ProfileIcon initials="MG" isDark={false} size={40} />
                            <View>
                                <Text className="text-base font-bold text-gray-800">María García</Text>
                                <Text className="text-xs text-gray-500">Fragment para Carlos</Text>
                            </View>
                        </View>

                        {/* Text Input */}
                        <View className="relative rounded-3xl overflow-hidden mb-5 border border-gray-100/50">
                            <LinearGradient
                                colors={['#FFF7ED', '#F0FDFA', '#FFFFFF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0.5, y: 0.5 }}
                                className="absolute inset-0"
                            >
                                <TextInput
                                    placeholder="Escribe tu fragmento..."
                                    placeholderTextColor="#9ca3af"
                                    multiline
                                    maxLength={maxChars}
                                    className="text-base text-gray-800 p-4"
                                    value={text}
                                    onChangeText={setText}
                                />
                            </LinearGradient>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
       </Modal>
    );
}