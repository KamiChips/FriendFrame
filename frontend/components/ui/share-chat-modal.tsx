import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // <-- 1. IMPORTAMOS BLURVIEW
import { useShareToChat } from '@/hooks/useShareToChat';
import type { ShareTarget } from '@/services/supabase/chat/chat.types';
import type { SocialUser } from '@/services/supabase/social/social.types';

// Colores de avatar alineados a tu paleta
const AVATAR_COLORS = ['#30C2D9', '#FF9B42', '#115A67', '#AA3E14', '#182240'];

const getAvatarColor = (index: number) =>
  AVATAR_COLORS[index % AVATAR_COLORS.length];

type Props = {
  visible: boolean;
  onClose: () => void;
  target: ShareTarget;
  onShared?: (shared: number, failed: number) => void;
};

export default function ShareChatModal({ visible, onClose, target, onShared }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { friends, loading, sharing, share, loadFriends } = useShareToChat();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible, loadFriends]);

  const handleClose = () => {
    setSelected(new Set());
    setSearch('');
    onClose();
  };

  const toggleSelect = (userId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const handleShare = async () => {
    if (!selected.size) return;
    
    const userIds = Array.from(selected);
    await share(target, userIds);

    onShared?.(selected.size, 0);
    handleClose();
  };

  const filtered = friends?.filter(f =>
    f.full_name.toLowerCase().includes(search.toLowerCase()) ||
    f.username.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const hasSelection = selected.size > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      {/* 2. ENVOLVEMOS EL FONDO EN EL BLURVIEW */}
      <BlurView 
        intensity={isDark ? 40 : 25} // Ajusta la intensidad (0-100)
        tint={isDark ? "dark" : "light"} 
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <SafeAreaView className="w-full">
          {/* Diseño actualizado con tu config de Tailwind */}
          <View className="rounded-t-[30px] pt-5 px-5 pb-8 min-h-[420px] max-h-[80%] bg-background-light dark:bg-background-semidark border-t border-gray-200 dark:border-background-dark">
            
            {/* Indicador de arrastre visual */}
            <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-4" />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-spartan-bold text-black dark:text-white">
                Compartir
              </Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12} className="bg-gray-200 dark:bg-background-dark rounded-full p-1.5">
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? 'white' : 'black'}
                />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="flex-row items-center rounded-2xl border h-12 px-4 mb-4 bg-gray-100 border-gray-200 dark:bg-background-dark dark:border-transparent">
              <Ionicons
                name="search-outline"
                size={18}
                color={isDark ? '#8A8A8E' : '#6B6B6B'}
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="flex-1 text-[15px] h-11 text-black dark:text-white font-spartan"
                placeholder="Buscar amigos..."
                placeholderTextColor={isDark ? '#8A8A8E' : '#6B6B6B'}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Estados */}
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={isDark ? "#FF9B42" : "#30C2D9"} />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={item => item.user_id}
                className="flex-1"
                ListEmptyComponent={
                  <Text className="text-center font-spartan text-sm mt-6 text-gray-500">
                    {search ? "No se encontraron resultados" : "Aún no tienes amigos para compartir"}
                  </Text>
                }
                ItemSeparatorComponent={() => (
                  <View className="h-px bg-gray-200 dark:bg-white/5" />
                )}
                renderItem={({ item, index }: { item: SocialUser; index: number }) => {
                  const isSelected = selected.has(item.user_id);
                  const initials = item.full_name
                    .split(' ')
                    .slice(0, 2)
                    .map(w => w[0])
                    .join('')
                    .toUpperCase();

                  return (
                    <TouchableOpacity
                      className="flex-row items-center py-3 px-2"
                      onPress={() => toggleSelect(item.user_id)}
                      activeOpacity={0.7}
                    >
                      {/* Avatar */}
                      <View
                        className="w-12 h-12 rounded-full overflow-hidden items-center justify-center mr-4"
                        style={{ backgroundColor: getAvatarColor(index) }}
                      >
                        {item.profile_pic ? (
                          <Image
                            source={{ uri: item.profile_pic }}
                            className="w-12 h-12"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-white text-base font-spartan-bold">{initials}</Text>
                        )}
                      </View>

                      {/* Nombre y username */}
                      <View className="flex-1">
                        <Text className="text-base font-spartan-bold text-black dark:text-white">
                          {item.full_name}
                        </Text>
                        <Text className="text-sm font-spartan text-gray-500">
                          @{item.username}
                        </Text>
                      </View>

                      {/* Radio / Checkbox adaptado */}
                      <View
                        className="w-6 h-6 rounded-full border-2 items-center justify-center"
                        style={{
                          borderColor: isSelected 
                            ? (isDark ? '#FF9B42' : '#30C2D9') 
                            : (isDark ? '#404b65' : '#D1D5DB'),
                          backgroundColor: isSelected 
                            ? (isDark ? '#FF9B42' : '#30C2D9') 
                            : 'transparent',
                        }}
                      >
                        {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Footer / Botón Enviar */}
            <View className="pt-4 mt-2">
              <TouchableOpacity
                className={`rounded-2xl h-[50px] flex-row items-center justify-center gap-2 ${
                  hasSelection && !sharing
                    ? 'bg-primary-light dark:bg-tertiary-dark' // Cyan o Naranja Oscuro
                    : 'bg-gray-200 dark:bg-background-dark' // Deshabilitado
                }`}
                onPress={handleShare}
                disabled={!hasSelection || sharing}
                activeOpacity={0.8}
              >
                {sharing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons
                      name="send"
                      size={18}
                      color={hasSelection ? 'white' : (isDark ? '#8A8A8E' : '#9CA3AF')}
                    />
                    <Text className={`text-lg font-spartan-bold ${
                      hasSelection ? 'text-white' : (isDark ? 'text-[#8A8A8E]' : 'text-[#9CA3AF]')
                    }`}>
                      {`Enviar (${selected.size})`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}