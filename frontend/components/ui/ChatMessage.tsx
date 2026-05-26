import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import '../../global.css';
import ProfileIcon from "./ProfileIcon";

interface ChatMessageProps {
    message: string;
    time: string;
    sender: string;
    initials?: string;
    isDark: boolean;
}

const ChatMessage = ({ message, time, sender, initials, isDark }: ChatMessageProps) => {
    const isMe = sender === 'me';

    const messageContent = (
        <>
            <Text className={`${isMe ? 'text-background-light' : 'text-black dark:text-gray-200'} pr-2 flex-shrink font-spartan`}>
                {message}
            </Text>
            <Text className={`${isMe ? 'text-background-gray' : 'text-[#aaa]'} text-[0.7rem] self-end mt-1 font-spartan`}>
                {time}
            </Text>
        </>
    );

    console.log(initials)

    return (
        <View className={`${isMe ? 'self-end' : 'self-start'} max-w-[65%] my-1`}>
            {isMe ? (
                <LinearGradient
                    colors={isDark ? ["#AA3E14", "#924A31", "#115A67"] : ["#30C2D9", "#30C2D9", "#FF9B42"]}
                    style={{ borderRadius: 16, borderTopRightRadius: 8, padding: 12, flexDirection: 'row' }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.6, y: 0.7 }}
                >
                    {messageContent}
                </LinearGradient>
            ) : (
                <View className="flex-row">
                    <ProfileIcon initials={initials || ""} isDark={isDark} size={32} />
                    <View className="ml-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-lg flex-row border border-[#e6e6e6] dark:border-[#404b65]">
                        {messageContent}
                    </View>
                </View>
            )}
        </View>
    );
};

export default ChatMessage;