import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import SearchBar from "@/components/ui/SearchBar";
import SelectableUserRow from "@/components/ui/SelectableUserRow";
import { useAuth } from "@/context/AuthContext";
import { getFriends } from "@/services/supabase/social/social.relationship";
import { SocialUser } from "@/services/supabase/social/social.types";
import { createGroupChat } from "@/services/supabase/chat/chat.conversation";

export default function CreateGroupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();

  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await getFriends(user.user_id);
      if (data) setFriends(data);
      setLoadingFriends(false);
    };

    load();
  }, [user]);

  const filteredFriends = friends.filter(
    (f) =>
      f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleFriend = (userId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedFriends.length === 0) return;

    setCreating(true);
    const { data, error } = await createGroupChat(
      groupName.trim(),
      selectedFriends,
    );
    setCreating(false);

    if (error) {
      Alert.alert("Error", error);
      return;
    }

    if (data) {
      router.replace({
        pathname: "/(tabs)/ChatScreen",
        params: {
          chatId: data.chat_id,
          chatName: data.group_name ?? groupName,
          chatInitials: groupName.charAt(0).toUpperCase(),
          isGroup: "true",
        },
      });
    }
  };

  const canCreate =
    groupName.trim().length > 0 && selectedFriends.length > 0 && !creating;

  return (
    // KeyboardAvoidingView evita que el teclado de Android/iOS oculte la UI
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 justify-end bg-black/50" // Fondo translúcido oscuro
    >
      {/* TARJETA INFERIOR (Bottom Sheet) */}
      <View className="bg-background-light dark:bg-background-semidark rounded-t-[32px] px-6 pt-6 pb-8 max-h-[90%] shadow-lg">
        {/* HEADER DEL MODAL */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="font-spartan-bold text-2xl text-background-dark dark:text-background-light">
            Crear Grupo
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="close"
              size={28}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="w-full">
          {/* INPUT: NOMBRE DEL GRUPO */}
          <View className="mb-6">
            <Text className="font-spartan-bold text-sm text-background-dark dark:text-background-light mb-2">
              Nombre del grupo
            </Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Ej: Los mejores amigos"
              placeholderTextColor="#8A8A8E"
              maxLength={30}
              className="w-full h-14 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl px-4 font-spartan text-base text-background-dark dark:text-background-light"
            />
          </View>

          {/* SECCIÓN: AGREGAR MIEMBROS */}
          <View className="mb-2">
            <Text className="font-spartan-bold text-sm text-background-dark dark:text-background-light mb-2">
              Agregar miembros ({selectedFriends.length} seleccionados)
            </Text>

            {/* Buscador (Reutilizable) */}
            <View className="mb-4">
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar amigos..."
              />
            </View>

            {/* Lista de Amigos (Reutilizable) */}
            <View className="pb-6">
              {loadingFriends ? (
                <ActivityIndicator color="#30C2D9" className="mt-4" />
              ) : filteredFriends.length === 0 ? (
                <Text className="text-gray-400 text-center font-spartan mt-4">
                  {searchQuery
                    ? `Sin resultados para "${searchQuery}"`
                    : "No tienes amigos para añadir al grupo"}
                </Text>
              ) : (
                filteredFriends.map((friend) => (
                  <SelectableUserRow
                    key={friend.user_id}
                    name={friend.full_name}
                    username={friend.username}
                    avatarSource={
                      friend.profile_pic ? { uri: friend.profile_pic } : null
                    }
                    isSelected={selectedFriends.includes(friend.user_id)}
                    onToggle={() => toggleFriend(friend.user_id)}
                  />
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* BOTÓN CREAR */}
        <TouchableOpacity
          disabled={!canCreate}
          onPress={handleCreate}
          className={`py-4 rounded-xl items-center mt-2 ${
            groupName.length > 0 && selectedFriends.length > 0
              ? "bg-primary-light dark:bg-primary-dark"
              : "bg-gray-300 dark:bg-gray-700"
          }`}
        >
          {creating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-spartan-bold text-white text-lg">Crear</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
