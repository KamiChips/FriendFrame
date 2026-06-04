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
//import { useShareToChat } from '@/hooks/useShareToChat';
import type { ShareTarget } from '@/services/supabase/chat/chat.types';
import type { SocialUser } from '@/services/supabase/social/social.types';

// ── Mocks ──────────────────────────────────────────────
const MOCK_FRIENDS: SocialUser[] = [
  {
    user_id: '1',
    full_name: 'Carlos Ramírez',
    username: 'carlosR',
    profile_pic: null,
    i_follow_them: true,
    is_friend: true,
  },
  {
    user_id: '2',
    full_name: 'Ana López',
    username: 'analopez',
    profile_pic: null,
    i_follow_them: true,
    is_friend: true,
  },
  {
    user_id: '3',
    full_name: 'Luis Torres',
    username: 'luistorres',
    profile_pic: null,
    i_follow_them: true,
    is_friend: true,
  },
];

const AVATAR_COLORS = ['#A0522D', '#8B6F47', '#5A7A6B', '#4A7A8A', '#7A5A8A'];

const getAvatarColor = (index: number) =>
  AVATAR_COLORS[index % AVATAR_COLORS.length];

// ── Props ──────────────────────────────────────────────
type Props = {
  visible: boolean;
  onClose: () => void;
  target: ShareTarget;
  onShared?: (shared: number, failed: number) => void;
};

export default function ShareChatModal({ visible, onClose, target, onShared }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [friends, setFriends]   = useState<SocialUser[]>([]);
  const [loading, setLoading]   = useState(false);
  const [sharing, setSharing]   = useState(false);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Simula carga con delay
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    const timer = setTimeout(() => {
      setFriends(MOCK_FRIENDS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [visible]);

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

  // Simula el share con delay
  const handleShare = async () => {
    if (!selected.size) return;
    setSharing(true);
    await new Promise(res => setTimeout(res, 1000));
    setSharing(false);
    onShared?.(selected.size, 0);
    handleClose();
  };

  const filtered = friends.filter(f =>
    f.full_name.toLowerCase().includes(search.toLowerCase()) ||
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const hasSelection = selected.size > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/60">
        <SafeAreaView className="w-full">
          <View className="rounded-t-[20px] pt-5 px-4 pb-2 min-h-[420px] max-h-[80%] bg-white dark:bg-[#1B2A42]">

            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-[#0F1C2E] dark:text-white">
                Compartir en Chat
              </Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12} className="p-1">
                <Ionicons
                  name="close"
                  size={22}
                  color={isDark ? '#8A9BB0' : '#5A6A7A'}
                />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="flex-row items-center rounded-xl border h-11 px-3 mb-3 bg-[#F0F4F8] border-[#D8E2EC] dark:bg-[#243450] dark:border-[#2E4165]">
              <Ionicons
                name="search-outline"
                size={18}
                color={isDark ? '#5A7090' : '#9AAABB'}
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="flex-1 text-[15px] h-11 text-[#0F1C2E] dark:text-white"
                placeholder="Buscar conversaciones..."
                placeholderTextColor={isDark ? '#5A7090' : '#9AAABB'}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Estados */}
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#4A90D9" />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={item => item.user_id}
                className="flex-1"
                ListEmptyComponent={
                  <Text className="text-center text-sm mt-6 text-[#9AAABB] dark:text-[#5A7090]">
                    No se encontraron conversaciones
                  </Text>
                }
                ItemSeparatorComponent={() => (
                  <View className="h-px bg-[#E8EFF6] dark:bg-[#1E3050]" />
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
                      className="flex-row items-center py-[14px] px-1"
                      onPress={() => toggleSelect(item.user_id)}
                      activeOpacity={0.7}
                    >
                      {/* Avatar */}
                      <View
                        className="w-11 h-11 rounded-full overflow-hidden items-center justify-center mr-[14px]"
                        style={{ backgroundColor: getAvatarColor(index) }}
                      >
                        {item.profile_pic ? (
                          <Image
                            source={{ uri: item.profile_pic }}
                            className="w-11 h-11"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="text-white text-sm font-bold">{initials}</Text>
                        )}
                      </View>

                      {/* Nombre y username */}
                      <View className="flex-1">
                        <Text className="text-base font-medium text-[#0F1C2E] dark:text-[#E8F0FA]">
                          {item.full_name}
                        </Text>
                        <Text className="text-xs text-[#9AAABB] dark:text-[#5A7090]">
                          @{item.username}
                        </Text>
                      </View>

                      {/* Radio */}
                      <View
                        className="w-[22px] h-[22px] rounded-full border-2 items-center justify-center"
                        style={{
                          borderColor: isSelected ? '#4A90D9' : isDark ? '#3A5070' : '#B0C4D8',
                          backgroundColor: isSelected ? '#4A90D9' : 'transparent',
                        }}
                      >
                        {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Footer */}
            <View className="py-4">
              <TouchableOpacity
                className={`rounded-[14px] h-[50px] flex-row items-center justify-center gap-2 ${
                  hasSelection && !sharing
                    ? 'bg-[#4A90D9]'
                    : isDark ? 'bg-[#2A3F5A]' : 'bg-[#E8EFF6]'
                }`}
                onPress={handleShare}
                disabled={!hasSelection || sharing}
                activeOpacity={0.8}
              >
                {sharing ? (
                  <ActivityIndicator color={isDark ? '#4A6080' : '#9AAABB'} />
                ) : (
                  <>
                    <Ionicons
                      name="send-outline"
                      size={18}
                      color={hasSelection ? '#FFFFFF' : isDark ? '#4A6080' : '#9AAABB'}
                    />
                    <Text className={`text-base font-semibold ${
                      hasSelection
                        ? 'text-white'
                        : isDark ? 'text-[#4A6080]' : 'text-[#9AAABB]'
                    }`}>
                      {`Enviar (${selected.size})`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}