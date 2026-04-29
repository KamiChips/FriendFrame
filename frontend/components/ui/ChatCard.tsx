import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import '../../global.css';

type ChatCardProps = {
    id: number,
    initials: string;
    name: string;
    message: string;
    time: string;
    unread: boolean;
    isDark: boolean;
}

const ChatCard = ({ initials, name, message, time, unread, isDark }:ChatCardProps) => {
    return (
        <TouchableOpacity
            className="flex-row items-center bg-background-light mx-4 mb-3 px-4 py-3 rounded-2xl dark:bg-background-semidark"
            activeOpacity={0.7}
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
            }}
        >
            {/* Perfil de usuario */}
            <TouchableOpacity>
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

                    {/* Puntito de no leido */}
                    {unread && (
                        <View 
                            className="absolute -top-1 -right-1 w-5 h-5 bg-primary-dark rounded-full border-2 border-background-light dark:bg-secondary-dark dark:border-background-semidark"
                        >
                        </View>
                    )}
                </View>
            </TouchableOpacity>
            
            {/* Info del Chat */}
            <View className="flex-1">
                <Text className="font-semibold text-[#1a1a1a] mb-0.5 dark:text-background-light">{name}</Text>
                <Text className="text-xs text-[#888] dark:text-background-light">{message}</Text> 
            </View>

            <Text className="text-xs text-[#aaa] ml-2">{time}</Text>
        </TouchableOpacity>
    )
}

export default ChatCard
