import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // Para los degradados del diseño
import "../../global.css";
import { useAuth } from "@/context/AuthContext";
import {
  editFullName,
  editUsername,
  updateProfilePic,
} from "@/services/supabase/auth/auth.profile";
import { loadStaticParamsAsync } from "expo-router/build/loadStaticParamsAsync";
import { Image } from "expo-image";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentName: string;
  currentUsername: string;
  onSaved: (name: string, username: string, newPic?: string) => void;
}

export function EditProfileModal({
  visible,
  onClose,
  currentName,
  currentUsername,
  onSaved,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [username, setUsername] = useState(currentUsername);
  const [loading, setLoading] = useState(false);
  const [picLoading, setPicLoading] = useState(false);
  const { user, setProfilePic } = useAuth();
  const [isDark, setIsDark] = useState(useColorScheme() === "dark");
  const size = 80; // Tamaño del avatar

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setUsername(currentUsername);
    }
  }, [visible, currentName, currentUsername]);

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);

    const nameChanged = name.trim() !== currentName;
    const usernameChanged = username.trim().toLowerCase() !== currentUsername;

    const promises: Promise<{ data: any; error: string | null }>[] = [];

    if (nameChanged) promises.push(editFullName(name));
    if (usernameChanged) promises.push(editUsername(username));

    if (promises.length === 0) {
      setLoading(false);
      onClose();
      return;
    }

    const results = await Promise.all(promises);
    setLoading(false);

    const failed = results.find((r) => r.error);
    if (failed?.error) {
      Alert.alert("Error", failed.error);
      return;
    }

    onSaved(name.trim(), username.trim().toLowerCase());
    onClose();
  };

  const handleChangePic = async () => {
    if (!user || picLoading) return;
    setPicLoading(true);

    const { data: newUrl, error } = await updateProfilePic(user.user_id);
    setPicLoading(false);

    if (error) {
      Alert.alert("Error", error);
      return;
    }

    if (newUrl) {
      console.log("Nueva URL de foto:", newUrl);
      setProfilePic(newUrl);
      onSaved(name, username, newUrl);
    }
  };

  const initials = currentName
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Contenedor principal */}
      <View className="flex-1 justify-end bg-black/60">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-full"
        >
          {/* Tarjeta Blanca del Modal */}
          <View className="flex-col bg-background-light dark:bg-background-dark rounded-t-[32px] px-6 pt-10 pb-14 shadow-2xl border-t border-gray-100 dark:border-neutral-800">
            {/* Encabezado del modal */}
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-xl font-bold text-[#1D2A4F] dark:text-white">
                Editar Perfil
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="p-1 bg-gray-100 dark:bg-background-semidark rounded-full"
                disabled={loading}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? "#FAFAFA" : "#2C2C2C"}
                  className="dark:text-white"
                />
              </TouchableOpacity>
            </View>

            {/* avatar */}
            <View className="items-center mb-8">
              <View className="relative">
                <View className={`rounded-full overflow-hidden w-90`}>
                  {user?.profile_pic ? (
                    <Image
                      source={{ uri: user.profile_pic }}
                      style={{ width: size, height: size }}
                      contentFit="cover"
                      cachePolicy="none"
                    />
                  ) : (
                    <LinearGradient
                      colors={
                        isDark
                          ? ["#182240", "#AA3E14", "#115A67"]
                          : ["#FAFAFA", "#30C2D9", "#FF9B42"]
                      }
                      style={{
                        width: size,
                        height: size,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.7, y: 0.7 }}
                    >
                      <Text className="text-white text-3xl font-bold tracking-wider">
                        {initials}
                      </Text>
                    </LinearGradient>
                  )}
                </View>

                {/* Botón de añadir */}
                <TouchableOpacity
                  className="absolute right-0 bottom-0 bg-[#34C2DD] border-2 border-white w-8 h-8 rounded-full items-center justify-center shadow-md active:opacity-80 dark:bg-[#AA3E14] dark:border-neutral-950"
                  onPress={handleChangePic}
                  disabled={picLoading}
                >
                  {picLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="add" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* formulario */}
            <View className="space-y-5 mb-4">
              {/* Input 1: Nombre completo */}
              <View className="mb-4">
                <View className="flex-row items-center mb-2">
                  <Feather
                    name="user"
                    size={20}
                    color={isDark ? "#FAFAFA" : "#2C2C2C"}
                    className="dark:text-background-light mr-2"
                  />
                  <Text className="font-bold text- dark:text-[#FAFAFA] text-base">
                    Nombre completo
                  </Text>
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="bg-[#EAEAEA] dark:bg-background-semidark border-2 border-[#E0E0E0] dark:border-[#2D3B63] p-4 rounded-xl text-gray-700 dark:text-white font-medium text-base text-left justify-center"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                  maxLength={120}
                />
              </View>

              {/* Input 2: Nombre de usuario */}
              <View className="mb-2">
                <View className="flex-row items-center mb-2">
                  <Feather
                    name="at-sign"
                    size={20}
                    color={isDark ? "#FAFAFA" : "#2C2C2C"}
                    className="dark:text-neutral-400 mr-2"
                  />
                  <Text className="font-bold text-[#1D2A4F] dark:text-white text-base">
                    Nombre de usuario
                  </Text>
                </View>
                <TextInput
                  value={username}
                  onChangeText={(t) =>
                    setUsername(t.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ""))
                  }
                  autoCapitalize="none"
                  className="text-left justify-center bg-[#EAEAEA] dark:bg-background-semidark border-2 border-[#E0E0E0] dark:border-[#2D3B63] p-4 rounded-xl text-gray-700 dark:text-white font-medium text-base"
                  placeholderTextColor="#9CA3AF"
                  maxLength={30}
                />
                <Text className="text-gray-400 text-xs mt-1.5 ml-1">
                  Solo letras, números y guiones bajos
                </Text>
              </View>
            </View>

            {/* guardar */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
              className="active:opacity-90 shadow-md rounded-2xl overflow-hidden"
            >
              <LinearGradient
                colors={["#34C2DD", "#FBA353"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }} // Gradiente horizontal
                className="w-full justify-center items-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row py-5 items-center justify-center ">
                    <Ionicons
                      name="save-outline"
                      size={20}
                      color="white"
                      className="mr-2 flex"
                    />
                    <Text className=" text-white font-bold text-base">
                      Guardar Cambios
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
