import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NewFragment } from "./NewFragment";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import CreatePostModal from "./create-post-modal";

interface FloatingMenuProps {
  onCreatePost?: () => void;
  onCreateFragment?: () => void;
  targetUserId?: string;
  targetUserName?: string;
  targetUserInitials?: string;
  targetUserImage?: string | null;
  currentUserId?: string;
}

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 83 : 65;

export function FloatingMenu({
  onCreatePost,
  onCreateFragment,
  targetUserId = "",
  targetUserName = "Usuario",
  targetUserInitials = "??",
  targetUserImage,
  currentUserId,
}: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);

  const animation = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  const overlayOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const menuOpacity = animation.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  const menuScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const pointerEvents = isOpen ? "auto" : "none";
  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Animated.View
        pointerEvents={pointerEvents}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: overlayOpacity,
        }}
      >
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <BlurView intensity={50} tint="dark" style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>
      <Animated.View
        pointerEvents={pointerEvents}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          opacity: overlayOpacity,
        }}
      >
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <View
        style={{
          position: "absolute",
          bottom: bottomOffset + 16,
          right: 24,
          alignItems: "flex-end",
        }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={{
            transform: [{ translateY }, { scale: menuScale }],
            opacity: menuOpacity,
            alignItems: "flex-end",
            marginBottom: 12,
          }}
          pointerEvents={pointerEvents}
        >
          {/* BOTÓN CREAR POST */}
          <TouchableOpacity
            onPress={() => {
              toggleMenu();
              setIsPostModalVisible(true); // Abre el nuevo modal
            }}
            activeOpacity={0.85}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "white",
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 100,
              marginBottom: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Ionicons name="image-outline" size={18} color="#06b6d4" />
            <Text
              style={{
                color: "#1f2937",
                fontWeight: "600",
                fontSize: 14,
                marginLeft: 8,
              }}
            >
              Crear Post
            </Text>
          </TouchableOpacity>

          {/* BOTÓN CREAR FRAGMENT */}
          <TouchableOpacity
            onPress={() => {
              toggleMenu();
              setIsModalVisible(true);
            }}
            activeOpacity={0.85}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "white",
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 100,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#f97316" />
            <Text
              style={{
                color: "#1f2937",
                fontWeight: "600",
                fontSize: 14,
                marginLeft: 8,
              }}
            >
              Crear Fragment
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          onPress={toggleMenu}
          activeOpacity={0.9}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isOpen ? "#6b7280" : "#f59e0b",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={28} color="#ffffff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Modal de Fragment */}
      <NewFragment
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onPublishSuccess={() => {
          setIsModalVisible(false);
          onCreateFragment?.();
        }}
        targetUserId={targetUserId}
        targetUserName={targetUserName}
        targetUserInitials={targetUserInitials}
        targetUserImage={targetUserImage}
      />

      {/* NUEVO: Modal de Crear Post */}
      <CreatePostModal
        visible={isPostModalVisible}
        onClose={() => setIsPostModalVisible(false)}
        onPublishSuccess={() => {
          setIsPostModalVisible(false);
          onCreatePost?.()
        }}
        targetUserId={targetUserId}
        targetProfileName={targetUserName}
        currentUserId={currentUserId ?? ""}
        currentUserName={targetUserName}
        currentUserInitials={targetUserInitials}
      />
    </View>
  );
}
