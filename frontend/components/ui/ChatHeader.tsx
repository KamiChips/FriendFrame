import { View, TouchableOpacity, Text } from "react-native";
import ProfileIcon from "./ProfileIcon";
import GoBackButton from "./GoBackButton";

interface ChatHeaderProps {
    isDark: boolean,
    username: string,
    initials: string,
    lastActive: string,
}

const ChatHeader = ({isDark, username, initials, lastActive} : ChatHeaderProps) => {
    return (
        <View className="opacity-85 flex-row pl-1 pb-2 dark:bg-background-dark dark:opacity-100 border-b border-[#e6e6e6] dark:border-[#404b65]">
            <GoBackButton isDark={isDark} />
            
            <View className="">
                <TouchableOpacity className="flex-row justify-center">
                    <View className="mr-3 relative">
                        <ProfileIcon initials={initials} isDark={isDark} />
                    </View>

                    <View>
                        <Text className="font-bold text-xl dark:text-background-light font-spartan">{username}</Text>
                        <Text className="font-light text-sm dark:text-background-light font-spartan">{lastActive}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default ChatHeader;