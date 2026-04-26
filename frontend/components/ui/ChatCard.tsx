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
}

const ChatCard = ({ initials, name, message, time, unread }:ChatCardProps) => {

    const colorScheme = useColorScheme();
    const isDark = false;

    return (
        <TouchableOpacity
            className="flex-row items-center bg-background-light mx-4 mb-3 px-4 py-3 rounded-2xl"
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
                <View className="mr-3">
                    <LinearGradient  
                        colors={
                            isDark ? ["#182240", "#115A67", "#AA3E14"] 
                            : ["#FAFAFA", "#30C2D9", "#FF9B42"]
                        }
                        style={{
                            width: 48,
                            height: 40,
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
            </TouchableOpacity>
            
            {/* Info del Chat */}
            <View className="flex-1">
                <Text className="font-semibold text-[#1a1a1a] mb-0.5">{name}</Text>
                <Text className="text-xs text-[#888]">{message}</Text> 
            </View>

            <Text className="text-xs text-[#aaa] ml-2">{time}</Text>
        </TouchableOpacity>
    )
}

export default ChatCard
