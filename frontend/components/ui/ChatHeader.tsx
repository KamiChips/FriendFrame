import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

interface ChatHeaderProps {
    isDark: boolean,
    username: string,
    initials: string,
    lastActive: string,
}

const ChatHeader = ({isDark, username, initials, lastActive} : ChatHeaderProps) => {
    return (
        <View className="opacity-85 flex-row pl-1 pb-2 dark:bg-background-dark dark:opacity-100">
            <TouchableOpacity className="p-2" onPress={() => router.back()}>
                <Ionicons
                    name='arrow-back'
                    size={32}
                    color={ isDark ? "#FAFAFA" : '#000000'}
                />
            </TouchableOpacity>
            
            <View className="">
                <TouchableOpacity className="flex-row justify-center">
                    <View className="mr-3 relative">
                        <LinearGradient  
                            colors={
                                isDark ? ["#182240", "#115A67", "#AA3E14"] 
                                : ["#FAFAFA", "#30C2D9", "#FF9B42"]
                            }
                            style={{
                                width: 48,
                                height: 48,
                                alignItems: 'center',
                                justifyContent: "center",
                                borderRadius: "50%",  
                            }}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.7, y: 0.7 }}
                        >
                            <Text className="text-background-light font-semibold">{initials}</Text>
                        </LinearGradient>
                    </View>

                    <View>
                        <Text className="font-bold text-xl dark:text-background-light">{username}</Text>
                        <Text className="font-light text-sm dark:text-background-light">{lastActive}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default ChatHeader;