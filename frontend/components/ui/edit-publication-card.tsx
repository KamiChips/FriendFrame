import React from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PublicationType = "post" | "fragment";

interface EditPublicationCardProps {
  initialContent: string;
  publicationType: PublicationType;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (content: string) => void;
}

const MAX_CONTENT_LENGTH = 280;

export default function EditPublicationCard({
  initialContent,
  publicationType,
  loading = false,
  onCancel,
  onConfirm,
}: EditPublicationCardProps) {
  const isDark = useColorScheme() === "dark";
  const [content, setContent] = React.useState(initialContent);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const trimmed = content.trim();
  const isFragment = publicationType === "fragment";
  const hasChanges = trimmed !== initialContent.trim();
  const canSave = hasChanges && (!isFragment || trimmed.length > 0) && !loading;

  React.useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <Animated.View
        style={{ opacity: opacityAnim }}
        className="flex-1 items-center justify-center bg-black/50 px-5"
      >
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          // Usamos background-light y background-semidark de tu config
          className="w-full rounded-3xl border border-gray-200 bg-background-light px-6 py-6 dark:border-background-dark dark:bg-background-semidark"
        >
          {/* Fondo del ícono: Primary Light (con opacidad 1A) y Primary Dark (con opacidad 1A) */}
          <View className="mb-4 h-20 w-20 items-center justify-center self-center rounded-full bg-[#30C2D91A] dark:bg-[#FF9B421A]">
            <Ionicons
              name="pencil-outline"
              size={32}
              // Cyan para light mode, Naranja Fosfo para dark mode
              color={isDark ? "#FF9B42" : "#30C2D9"}
              className="justify-center self-center"
            />
          </View>

          <Text className="mb-2 text-center font-spartan-bold text-xl text-black dark:text-white">
            Editar publicación
          </Text>
          <Text className="mb-4 text-center font-spartan text-lg text-gray-500 dark:text-gray-400">
            Actualiza el texto de tu publicación.
          </Text>

          {/* Caja de texto: background-gray para light, background-dark para dark */}
          <View className="mb-3 rounded-2xl border border-gray-200 bg-background-gray p-4 dark:border-transparent dark:bg-background-dark">
            <TextInput
              className="min-h-[120px] text-base text-black dark:text-white"
              editable={!loading}
              maxLength={MAX_CONTENT_LENGTH}
              multiline
              onChangeText={setContent}
              placeholder={
                isFragment
                  ? "Escribe tu fragment..."
                  : "Escribe una descripción..."
              }
              placeholderTextColor={isDark ? "#8A8A8E" : "#6B6B6B"}
              textAlignVertical="top"
              value={content}
            />
          </View>

          <Text className="mb-4 text-right font-spartan text-xs text-gray-500 dark:text-gray-400">
            {content.length} / {MAX_CONTENT_LENGTH}
          </Text>

          <View className="flex-row justify-center">
            {/* Botón Cancelar */}
            <Pressable
              className="mr-2 w-[40%] rounded-xl bg-background-gray p-3 px-4 dark:bg-background-dark"
              disabled={loading}
              onPress={onCancel}
            >
              <Text className="text-center font-spartan text-lg text-black dark:text-white">
                Cancelar
              </Text>
            </Pressable>

            {/* Botón Guardar: primary-light (cyan) para light mode, tertiary-dark (naranja oscuro) para dark mode */}
            <Pressable
              className="ml-2 w-[40%] rounded-xl bg-primary-light p-3 px-4 dark:bg-tertiary-dark"
              disabled={!canSave}
              onPress={() => onConfirm(content)}
              style={{ opacity: canSave ? 1 : 0.5 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center font-spartan-bold text-lg text-white">
                  Guardar
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}