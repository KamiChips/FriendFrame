import { useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

const BlockUserWarning = ({
  name,
  onBlock,
}: {
  name?: string;
  onBlock?: () => void;
}) => {
  const [visible, setVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isDark = useColorScheme() === "dark";

  const openModal = () => {
    setVisible(true);
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
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  return (
    <View>
      <Modal
        animationType="none"
        transparent={true}
        visible={visible}
        onRequestClose={closeModal}
      >
        <Animated.View
          style={{ opacity: opacityAnim }}
          className="flex-1 justify-center items-center bg-black/50"
        >
          <Animated.View
            style={{ transform: [{ scale: scaleAnim }] }}
            className="flex w-[90%] h-[33%] justify-center self-center border border-[#e6e6e6] dark:border-[#404b65] bg-background-light dark:bg-[#1F2B4A] rounded-3xl"
          >
            <View className="w-20 h-20 rounded-full bg-[#D4183D]/10 justify-center self-center mb-4">
              <Ionicons
                name="warning-outline"
                size={32}
                color={`${isDark ? "#82181A" : "#D4183D"}`}
                className="justify-center self-center"
              />
            </View>

            <Text className="font-spartan-bold text-xl text-[#2C2C2C] dark:text-background-light text-center mb-2">
              ¿Bloquear usuario?
            </Text>
            <Text className="font-spartan text-lg text-[#6B6B6B] dark:text-[#A0A0A0] text-center">
              ¿Estas seguro de bloquear a {name}?
            </Text>
            <Text className="font-spartan text-lg text-[#6B6B6B] dark:text-[#A0A0A0] text-center mb-4">
              No podrán ver tu perfil ni interactuar contigo.
            </Text>

            <View className="flex-row justify-center">
              <Pressable
                className="bg-[#E0E0E0] dark:bg-[#2A3654] w-[40%] p-3 px-4 mr-2 rounded-xl"
                onPress={closeModal}
              >
                <Text className="font-spartan text-lg text-[#2C2C2C] dark:text-[#F0F0F0] text-center">
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                className="bg-[#D4183D] dark:bg-[#82181A] w-[40%] p-3 px-4 ml-2 rounded-xl"
                onPress={() => {
                  closeModal();
                  onBlock?.();
                }}
              >
                <Text className="font-spartan text-lg text-[#FFFFFF] text-center">
                  Bloquear
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Trigger: línea separadora + texto sutil */}
      <Pressable
        className="flex-row items-center justify-center py-0.5"
        onPress={openModal}
      >
        <Ionicons
          name="ban-outline"
          size={20}
          color={isDark ? "#ef4444" : "#B91C1C"}
        />
        <Text className="font-spartan-bold text-base text-red-800 dark:text-red-500 ml-2">
          Bloquear usuario
        </Text>
      </Pressable>
    </View>
  );
};

export default BlockUserWarning;
