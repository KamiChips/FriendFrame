import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView, KeyboardAvoidingView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';

interface NewFragmentProps {
    isVisible: boolean;
    onClose: () => void;
    onPublish: (text: string) => void;
}

export const NewFragment = ({ isVisible, onClose, onPublish }: NewFragmentProps) => {
    const [text, setText] = useState('');
    const colorScheme = useColorScheme();
    const maxChars = 280;
    
    const handlePublish = () => {
        if (text.trim().length > 0) {
            onPublish(text);
        }
    };

    return (
        <Modal animationType="slide" transparent={false} visible={isVisible} onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#182240' : '#F9F9F9' }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                        <TouchableOpacity onPress={onClose} className="p-1">
                            <Ionicons name="close" size={24} color={colorScheme === 'dark' ? '#E5E7EB' : '#374151'} />
                        </TouchableOpacity>

                        <View className="flex-row items-center space-x-1">
                            <Ionicons name="sparkles-outline" size={18} color="#f97316" />
                            <MaskedView
                                maskElement={
                                    
                                    <Text className="text-lg font-bold"> Nuevo Fragment </Text>
                                }
                            >
                                <LinearGradient
                                    colors={['#f97316', '#06b6d4']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text className="text-lg font-bold opacity-0"> Nuevo Fragment </Text>
                                </LinearGradient>
                            </MaskedView>
                        </View>

                        <TouchableOpacity onPress={handlePublish} disabled={text.length === 0}>
                            <LinearGradient
                                colors={['#06b6d4', '#f97316']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="px-5 py-2 rounded-full"
                                style={{ opacity: text.length === 0 ? 0.5 : 1 }}
                            >
                                <Text className="font-semibold text-white">Publicar</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
                        {/* User Info */}
                        <View className="flex-row items-center mb-5">
                            <View
                                className="w-12 h-12 rounded-full items-center justify-center mr-3"
                                style={{ backgroundColor: colorScheme === 'dark' ? '#AA3E14' : '#5EEAD4' }}  // solid teal
                            >
                                <Text className="text-white font-bold text-sm">MG</Text>
                            </View>

                            <View>
                                <Text className="text-base font-bold text-gray-800  dark:text-white"> María González</Text>
                                <Text className="text-xs text-gray-400">Fragment para Carlos</Text>
                            </View>
                        </View>

                        {/* Text Input */}
                        <LinearGradient
                            colors={colorScheme === 'dark' ? ['#1B2B4B', '#162040', '#1B2B4B'] : ['#FFF7ED', '#F0FDFA', '#FFFFFF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.5, y: 0.5 }}
                            className="rounded-3xl mb-5 border border-gray-100"
                            style={{overflow: 'hidden'}}
                        >
                            <TextInput
                                placeholder="¿Qué piensas sobre tu amigo?"
                                placeholderTextColor={colorScheme === 'dark' ? '#9ca3af' : '#9ca3af'}
                                multiline
                                maxLength={maxChars}
                                style={{ minHeight: 160, textAlignVertical: 'top', borderRadius: 24 }}
                                className="text-base text-gray-800 dark:text-white p-4"
                                value={text}
                                onChangeText={setText}
                            />
                        </LinearGradient>

                        {/* Counter and Status */}
                        <View className="flex-row justify-between items-center px-1 mb-6">
                            <View className="flex-row items-center space-x-2">
                                {/* Teal progress circle */}
                                <View className="w-8 h-8 rounded-full border-2 border-cyan-400 items-center justify-center">
                                    {text.length > 0 && (
                                        <Text style={{ fontSize: 8 }} className="text-cyan-500">
                                            {Math.round((text.length / maxChars) * 100)}
                                        </Text>
                                    )}
                                </View>
                                <View className="ml-2">
                                    <Text className="text-sm font-bold text-cyan-500 dark:text-[#f97316]">
                                        {text.length} / {maxChars}
                                    </Text>
                                    <Text className="text-xs text-gray-400">caracteres</Text>
                                </View>
                            </View>

                            <View className="items-end">
                                <Text className="text-xs font-semibold text-gray-700 dark:text-white">
                                    Comienza a escribir
                                </Text>
                                <Text className="text-[10px] text-gray-400">Expresa tu pensamiento</Text>
                            </View>
                        </View>

                        {/* Tips */}
                        <View style={{
                            backgroundColor: colorScheme === 'dark' ? '#1B2B4B' : '#FFFFFF',
                            borderColor: colorScheme === 'dark' ? '#2A3F6F' : '#F3F4F6',
                            borderWidth: 1,
                        }} className="rounded-2xl p-4 shadow-sm shadow-gray-100/40">
                            <View className="flex-row items-center space-x-2 mb-3">
                                <Ionicons name="sparkles-outline" size={16} color={colorScheme === 'dark' ? '#f97316' : '#06b6d4'} />
                                <Text style={{ color: colorScheme === 'dark' ? '#E2E8F0' : '#1f2937' }}
                                className="text-sm font-bold ml-2">
                                    Tips para un gran Fragment
                                </Text>
                            </View>

                            <View className="space-y-2">
                                <View className="flex-row items-center space-x-2 mb-1">
                                    <Ionicons name="checkmark-circle" size={14} color={colorScheme === 'dark' ? '#f97316' : '#06b6d4'} />
                                    <Text style={{ color: colorScheme === 'dark' ? '#94A3B8' : '#374151' }}
                                        className="text-sm flex-1 ml-1">
                                        Sé auténtico y genuino con tus palabras
                                    </Text>
                                </View>
                                <View className="flex-row items-center space-x-2 mb-1">
                                    <Ionicons name="checkmark-circle" size={14} color={colorScheme === 'dark' ? '#f97316' : '#06b6d4'} />
                                    <Text style={{ color: colorScheme === 'dark' ? '#94A3B8' : '#374151' }}
                                        className="text-sm flex-1 ml-1">
                                        Comparte un recuerdo o momento especial
                                    </Text>
                                </View>
                                <View className="flex-row items-center space-x-2 mb-1">
                                    <Ionicons name="checkmark-circle" size={14} color={colorScheme === 'dark' ? '#f97316' : '#06b6d4'} />
                                    <Text style={{ color: colorScheme === 'dark' ? '#94A3B8' : '#374151' }}
                                        className="text-sm flex-1 ml-1">
                                        Hazlo personal y significativo
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
       </Modal>
    );
}