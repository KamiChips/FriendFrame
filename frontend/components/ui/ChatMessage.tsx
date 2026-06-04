import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image"; 
import '../../global.css';
import ProfileIcon from "./ProfileIcon";

interface ChatMessageProps {
    message: string;
    time: string;
    sender: string;
    initials?: string;
    isDark: boolean;
    media?: string | null; 
}

const ChatMessage = ({ message, time, sender, initials, isDark, media }: ChatMessageProps) => {
    const isMe = sender === 'me';

    const messageContent = (
        <View className="flex-col">
            {/* Si nos pasaron un link de media, mostramos la imagen */}
            {media && (
                <Image
                    source={{ uri: media }}
                    style={{ width: 220, height: 220, borderRadius: 12, marginBottom: 8 }}
                    contentFit="cover"
                    transition={200}
                />
            )}
            
            <View className="flex-row items-end justify-between">
                <Text className={`${isMe ? 'text-background-light' : 'text-black dark:text-gray-200'} pr-2 flex-shrink font-spartan`}>
                    {message}
                </Text>
                <Text className={`${isMe ? 'text-background-gray' : 'text-[#aaa]'} text-[0.7rem] self-end mt-1 font-spartan`}>
                    {time}
                </Text>
            </View>
        </View>
    );

    return (
        // Aumenté el max-w-[65%] a max-w-[75%] para que la foto no quede tan aplastada
        <View className={`${isMe ? 'self-end' : 'self-start'} max-w-[75%] my-1`}>
            {isMe ? (
                <LinearGradient
                    colors={isDark ? ["#AA3E14", "#924A31", "#115A67"] : ["#30C2D9", "#30C2D9", "#FF9B42"]}
                    // Quité el flexDirection: 'row' para que el flex-col interno funcione
                    style={{ borderRadius: 16, borderTopRightRadius: 8, padding: 12 }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.6, y: 0.7 }}
                >
                    {messageContent}
                </LinearGradient>
            ) : (
                <View className="flex-row">
                    <ProfileIcon initials={initials || ""} isDark={isDark} size={32} />
                    <View className="ml-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-lg border border-[#e6e6e6] dark:border-[#404b65]">
                        {messageContent}
                    </View>
                </View>
            )}
        </View>
    );
};

export default ChatMessage;