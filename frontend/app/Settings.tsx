import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import "../global.css";
import { Toggle } from "@/components/ui/Toggle";
import { EditProfileModal } from "@/components/ui/EditProfileModal";
import { signOut } from "@/services/supabase/auth/auth.sign-in";
import NotificationButton from "@/components/ui/NotificationButton";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();

  // Estado para controlar la pestaña activa (Fiel a image_a19276.png)
  const [activeTab, setActiveTab] = useState("General");
  const [isDark, setIsDark] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const tabs = ["General", "Bloqueados", "Mis Posts", "Mis Fragments"];
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: "María González",
    username: "maria_g",
  });

  const handleLogOut = async () => {
    setLoading(true);
    const { error } = await signOut();
    setLoading(false);

    if (error) Alert.alert("Error", error);
  };

  const darkBell = isDark ? false : true;

  return (
    <SafeAreaView className="flex-grow bg-background-light dark:bg-background-semidark">
      {/* Barra Superior */}
      <View className="flex-row justify-between items-center px-5 pt-2 pb-2 bg-background-light dark:bg-background-semidark border-b border-[#e6e6e6] dark:border-[#404b65]">
        {/* Este botón cierra el modal regresando a la pantalla anterior */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 active:opacity-60"
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color={isDark ? "#1D2A4F" : "#FAFAFA"}
            className="dark:text-white"
          />
        </TouchableOpacity>

        {/* Icono de campana con punto de notificación */}
        <NotificationButton isDark={darkBell} />
      </View>

      {/* Contenido Principal */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-6 pt-6 bg-background-gray dark:bg-background-dark"
      >
        {/* Título Principal */}
        <Text className="text-3xl font-bold text-[#1D2A4F] dark:text-white mb-6">
          Configuración
        </Text>

        {/* Pestañas Horizontales */}
        <View className="mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-full mr-3 ${
                    isActive
                      ? "bg-[#34C2DD] dark:bg-[#AA3E14]"
                      : "bg-[#E5E5E5] dark:bg-background-semidark"
                  }`}
                >
                  <Text
                    className={`font-semibold ${isActive ? "text-white" : "text-gray-500 dark:text-neutral-400"}`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Contenido de la pestaña General */}
        {activeTab === "General" && (
          <View className="flex flex-col pb-10">
            {/* Notificaciones */}
            <View className="bg-white dark:bg-background-semidark p-5 rounded-2xl border border-gray-100 dark:border-[#27345C] flex-row justify-between items-center mb-4 shadow-sm">
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={isDark ? "#1D2A4F" : "#FAFAFA"}
                  className="mr-4"
                />
                <View>
                  <Text className="text-lg font-bold text-[#1D2A4F] dark:text-white">
                    Notificaciones
                  </Text>
                  <Text className="text-gray-400 text-sm mt-0.5">
                    Mensajes, posts y likes
                  </Text>
                </View>
              </View>
              <View
                style={{ transform: [{ translateY: 5 }] }}
                className="items-center justify-center"
              >
                <Toggle
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              </View>
            </View>

            {/* Perfil */}
            <View className="bg-white dark:bg-background-semidark p-5 rounded-2xl border border-gray-100 dark:border-[#27345C] mb-4 shadow-sm">
              <Text className="text-lg font-bold text-[#1D2A4F] dark:text-white mb-1">
                Perfil
              </Text>
              <Text className="text-gray-400 text-sm mb-4">
                {userData.name} (@{userData.username})
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="active:opacity-60"
              >
                <Text className="text-[#34C2DD] font-semibold text-base">
                  Editar perfil
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón: Cerrar Sesión */}
            <TouchableOpacity
              className="bg-white dark:bg-background-semidark p-5 rounded-2xl border border-gray-100 dark:border-[#27345C] flex-row justify-center items-center shadow-sm active:opacity-70 mt-2"
              onPress={handleLogOut}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <MaterialIcons
                    name="logout"
                    size={20}
                    color="#DC2626"
                    className="mr-2"
                  />
                  <Text className="text-red-600 font-semibold text-base">
                    Cerrar sesión
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Contenido básico de relleno para las otras pestañas */}
        {activeTab === "Bloqueados" && (
          <View className="py-20 items-center">
            <Text className="text-gray-400 font-medium dark:text-neutral-500">
              Lista de usuarios bloqueados
            </Text>
          </View>
        )}

        {activeTab === "Mis Posts" && (
          <View className="py-20 items-center">
            <Text className="text-gray-400 font-medium dark:text-neutral-500">
              Historial de tus publicaciones
            </Text>
          </View>
        )}

        {activeTab === "Mis Fragments" && (
          <View className="py-20 items-center">
            <Text className="text-gray-400 font-medium dark:text-neutral-500">
              Aquí verás todos tus posts de solo texto
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal para editar perfil */}
      <EditProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentName={userData.name}
        currentUsername={userData.username}
        onSaved={(newName, newUsername) => {
          // Al guardar en el modal, actualizamos el estado de la pantalla principal
          setUserData({ name: newName, username: newUsername });
        }}
      />
    </SafeAreaView>
  );
}
