import React from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { deleteFragment, editFragment } from "@/services/supabase/posts/fragment";
import { deletePost, editPost } from "@/services/supabase/posts/posts";
import ConfirmActionCard from "./confirm-action-card";
import EditPublicationCard from "./edit-publication-card";

type PublicationType = "post" | "fragment";

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  publicationId?: string;
  publicationType?: PublicationType;
  initialContent?: string | null;
  onDeleted?: () => void;
  onEdited?: (content: string) => void;
}

export default function PostOptionsModal({
  visible,
  onClose,
  onEdit,
  onDelete,
  publicationId,
  publicationType,
  initialContent = "",
  onDeleted,
  onEdited,
}: PostOptionsModalProps) {
  const isDark = useColorScheme() === "dark";
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showEditForm, setShowEditForm] = React.useState(false);

  const closeModal = () => {
    if (isDeleting || isEditing) return;
    setShowDeleteConfirm(false);
    setShowEditForm(false);
    onClose();
  };

  const functionEditPostFragment = () => {
    if (!publicationId || !publicationType) {
      onEdit();
      closeModal();
      return;
    }

    setShowEditForm(true);
  };

  const confirmEditPostFragment = async (content: string) => {
    if (!publicationId || !publicationType || isEditing) return;

    setIsEditing(true);

    const result =
      publicationType === "post"
        ? await editPost(publicationId, content)
        : await editFragment(publicationId, content);

    setIsEditing(false);

    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }

    onEdited?.(content.trim());
    onEdit();
    closeModal();
  };

  const functionDeletePostFragment = () => {
    if (!publicationId || !publicationType) {
      onDelete?.();
      closeModal();
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDeletePostFragment = async () => {
    if (!publicationId || !publicationType || isDeleting) return;

    setIsDeleting(true);

    const result =
      publicationType === "post"
        ? await deletePost(publicationId)
        : await deleteFragment(publicationId);

    setIsDeleting(false);

    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }

    onDeleted?.();
    onDelete?.();
    closeModal();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeModal}
    >
      <BlurView intensity={isDark ? 40 : 15} tint="dark" style={{ flex: 1 }}>
        {showEditForm ? (
          <EditPublicationCard
            initialContent={initialContent ?? ""}
            publicationType={publicationType ?? "post"}
            loading={isEditing}
            onCancel={() => setShowEditForm(false)}
            onConfirm={confirmEditPostFragment}
          />
        ) : showDeleteConfirm ? (
          <ConfirmActionCard
            title="Eliminar publicacion"
            message={[
              "Esta accion no se puede deshacer.",
              "La publicacion se eliminara de este perfil.",
            ]}
            confirmText="Eliminar"
            iconName="trash-outline"
            loading={isDeleting}
            destructive
            onCancel={() => setShowDeleteConfirm(false)}
            onConfirm={confirmDeletePostFragment}
          />
        ) : (
          <View className="flex-1 justify-end">
            <Pressable style={{ flex: 1 }} onPress={closeModal} />

            <View className="w-full rounded-t-3xl bg-white px-6 pb-10 pt-4 shadow-lg dark:bg-[#1F2B4A]">
              <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-gray-300 dark:bg-gray-600" />

              <Pressable
                className="flex-row items-center border-b border-gray-100 py-4 dark:border-white/10"
                disabled={isEditing}
                onPress={functionEditPostFragment}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Ionicons
                    name="pencil-outline"
                    size={20}
                    color={isDark ? "white" : "black"}
                  />
                </View>
                <Text className="ml-4 font-spartan-bold text-lg text-black dark:text-white">
                  Editar publicacion
                </Text>
              </Pressable>

              <Pressable
                className="mt-2 flex-row items-center py-4"
                disabled={isDeleting}
                onPress={functionDeletePostFragment}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>
                <Text className="ml-4 font-spartan-bold text-lg text-[#EF4444]">
                  Eliminar publicacion
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </BlurView>
    </Modal>
  );
}
