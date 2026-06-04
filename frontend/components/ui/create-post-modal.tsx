import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library"; // NUEVA LIBRERÍA
import * as ImageManipulator from 'expo-image-manipulator';
import { useCreatePost } from "@/hooks/useCreatePost";

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPublishSuccess?: () => void;
  targetUserId: string;
  targetProfileName: string;
  currentUserId: string;
  currentUserName: string;
  currentUserInitials: string;
}

export default function CreatePostModal({
  visible,
  onClose,
  onPublishSuccess,
  targetUserId,
  targetProfileName,
  currentUserId,
  currentUserName,
  currentUserInitials,
}: CreatePostModalProps) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";

  const [step, setStep] = useState<1 | 2>(1);
  const [caption, setCaption] = useState("");

  // Estados de la Galería Integrada
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const {
    selectedAsset,
    isLoading,
    error,
    submit,
    clearAsset,
    reset,
    setAsset, // NUESTRA NUEVA FUNCIÓN DEL HOOK
  } = useCreatePost(currentUserId);

  // Cargar fotos cuando se abre el modal
  useEffect(() => {
    if (visible && step === 1) {
      loadGallery();
    }
  }, [visible, step]);

  const loadGallery = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === "granted");

    if (status === "granted") {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        first: 40, // Cargamos las últimas 40 fotos
        sortBy: ["creationTime"],
      });
      setPhotos(media.assets);

      // Auto-seleccionar la primera foto si no hay ninguna seleccionada
      if (media.assets.length > 0 && !selectedAsset) {
        handleSelectPhoto(media.assets[0]);
      }
    }
  };

  // Convertimos la foto al formato exacto y seguro que espera Supabase
  const handleSelectPhoto = async (photo: MediaLibrary.Asset) => {
    try {
      // MAGIA: Esto fuerza a iOS a leer la foto original (incluso si es HEIC o de iCloud),
      // no le aplica recortes ([]), y devuelve un JPEG limpio en una ruta file://
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [], 
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Le entregamos a la base de datos exactamente lo que pide
      setAsset({
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
        type: 'image',
        fileName: `foto_${Date.now()}.jpg`, // Generamos un nombre único y seguro
        mimeType: 'image/jpeg',             // Siempre será JPEG gracias al manipulador
      });

    } catch (err) {
      console.error("Error al procesar la imagen:", err);
      Alert.alert("Error", "No se pudo preparar la imagen para subir.");
    }
  };

  const handleClose = () => {
    setStep(1);
    setCaption("");
    clearAsset();
    reset();
    onClose();
  };

  const handleShare = async () => {
    const post = await submit(targetUserId, caption.trim());
    if (post) {
      onPublishSuccess?.();
      handleClose();
    } else if (error) {
      Alert.alert("Error", error);
    }
  };

  // Componente para dibujar cada cuadrito de la galería
  const renderGridItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const isSelected = selectedAsset?.uri === item.uri;

    return (
      <TouchableOpacity
        onPress={() => handleSelectPhoto(item)}
        activeOpacity={0.9}
        style={{
          width: "33.33%",
          aspectRatio: 1,
          borderWidth: 0.5,
          borderColor: isDark ? "#182240" : "white",
        }}
      >
        <Image
          source={{ uri: item.uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        {/* Filtro oscuro para fotos no seleccionadas */}
        {!isSelected && <View className="absolute inset-0 bg-black/40" />}
        {/* Palomita de selección */}
        {isSelected && (
          <View className="absolute top-2 right-2 bg-[#AA3E14] rounded-full p-1 border border-white">
            <Ionicons name="checkmark" size={14} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white dark:bg-[#182240]"
      >
        <View
          style={{ paddingTop: insets.top }}
          className="bg-white dark:bg-[#1F2B4A]"
        >
          {/* HEADER DINÁMICO */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-white/5">
            {step === 1 ? (
              <>
                <TouchableOpacity
                  onPress={handleClose}
                  className="p-1"
                  disabled={isLoading}
                >
                  <Ionicons
                    name="close"
                    size={26}
                    color={isDark ? "white" : "black"}
                  />
                </TouchableOpacity>
                <Text className="font-spartan-bold text-lg text-black dark:text-white">
                  Nueva publicación
                </Text>
                <TouchableOpacity
                  onPress={() => setStep(2)}
                  disabled={!selectedAsset || isLoading}
                  style={{ opacity: !selectedAsset || isLoading ? 0.5 : 1 }}
                >
                  <Text className="font-spartan-bold text-[#FBA353] text-base">
                    Siguiente
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  className="p-1"
                  disabled={isLoading}
                >
                  <Ionicons
                    name="chevron-back"
                    size={26}
                    color={isDark ? "white" : "black"}
                  />
                </TouchableOpacity>
                <Text className="font-spartan-bold text-lg text-black dark:text-white">
                  Nuevo Post
                </Text>
                <TouchableOpacity
                  onPress={handleShare}
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.5 : 1 }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FBA353" />
                  ) : (
                    <Text className="font-spartan-bold text-[#FBA353] text-base">
                      Compartir
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* --- PASO 1: GALERÍA INTEGRADA (ESTILO INSTAGRAM) --- */}
        {step === 1 && (
          <View className="flex-1 bg-white dark:bg-[#182240]">
            {/* PREVISUALIZACIÓN MITAD SUPERIOR */}
            <View className="w-full aspect-square bg-gray-100 dark:bg-black items-center justify-center overflow-hidden">
              {selectedAsset ? (
                <Image
                  source={{ uri: selectedAsset.uri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="contain"
                />
              ) : (
                <ActivityIndicator color="#FBA353" />
              )}
            </View>

            {/* BARRA DE HERRAMIENTAS */}
            <View className="flex-row justify-between items-center px-4 py-3 bg-gray-50 dark:bg-[#1F2B4A]">
              <Text className="font-spartan-bold text-base text-black dark:text-white">
                Recientes
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="camera-outline" size={20} color="#8A8A8E" />
              </View>
            </View>

            {/* CUADRÍCULA DE FOTOS MITAD INFERIOR */}
            {hasPermission === false ? (
              <View className="flex-1 items-center justify-center p-6">
                <Text className="text-center font-spartan text-gray-500">
                  Necesitamos acceso a tus fotos para mostrar la galería.
                </Text>
              </View>
            ) : (
              <FlatList
                data={photos}
                keyExtractor={(item) => item.id}
                numColumns={3}
                renderItem={renderGridItem}
                showsVerticalScrollIndicator={false}
                bounces={false}
              />
            )}
          </View>
        )}

        {/* --- PASO 2: PIE DE FOTO --- */}
        {step === 2 && (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* MINI PREVISUALIZACIÓN */}
            {selectedAsset && (
              <View className="w-full aspect-video bg-black items-center justify-center">
                <Image
                  source={{ uri: selectedAsset.uri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="contain"
                />
              </View>
            )}

            <View className="flex-1 px-4 pt-4 pb-10 bg-white dark:bg-[#182240]">
              <View className="flex-row items-center mb-4">
                <LinearGradient
                  colors={
                    isDark
                      ? ["#182240", "#AA3E14", "#115A67"]
                      : ["#FAFAFA", "#30C2D9", "#FF9B42"]
                  }
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.7, y: 0.7 }}
                >
                  <Text className="text-white text-xs font-bold">
                    {currentUserInitials}
                  </Text>
                </LinearGradient>
                <View className="ml-3">
                  <Text className="font-spartan-bold text-sm text-black dark:text-white">
                    {currentUserName}
                  </Text>
                  <Text className="font-spartan text-xs text-gray-500 dark:text-gray-400">
                    Publicando en el perfil de {targetProfileName}
                  </Text>
                </View>
              </View>

              <View className="relative bg-gray-50 dark:bg-[#1F2B4A] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                <TextInput
                  className="font-spartan text-base text-black dark:text-white min-h-[100px] pb-6"
                  placeholder="Escribe un pie de foto (opcional)..."
                  placeholderTextColor="#8A8A8E"
                  multiline
                  maxLength={280}
                  textAlignVertical="top"
                  value={caption}
                  onChangeText={setCaption}
                  editable={!isLoading}
                />
                <Text
                  className={`absolute bottom-3 right-4 text-xs font-spartan-bold ${
                    caption.length === 280 ? "text-[#AA3E14]" : "text-gray-400"
                  }`}
                >
                  {caption.length}/280
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
