import { TouchableOpacity, View, Text } from "react-native"
import ProfileIcon from "./ProfileIcon";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import Octicons from '@expo/vector-icons/Octicons';

export enum NotificationType {
    "LIKE",
    "COMMENT",
    "POST",
    "FOLLOW",
    "MENTION"
}

export interface NotificationCardProps {
    id: number,
    name: string,
    initials: string,
    time: string,
    unread: boolean,
    notificationType: NotificationType
    isDark: boolean,
    comment?: string,
}

const NotificationCard = ({ name, initials, time, unread, notificationType, isDark, comment = "" }: NotificationCardProps) => {
    let message = <></>;
    let icon = <></>
    switch(notificationType) {
        case NotificationType.LIKE:
            message = <><Text className="font-spartan-bold">{name}</Text> le dio like a tu post</>;
            icon = <Ionicons name="heart" size={20} color={`${isDark ? "#AA3E14" : "#FF9B42"}`} />
            break;
        case NotificationType.COMMENT:
            message = <><Text className="font-spartan-bold">{name}</Text> comentó en tu perfil: "{comment}"</>;
            icon = <FontAwesome name="comment-o" size={20} color={`${isDark ? "#115A67" : "#30C2D9"}`} />
            break;
        case NotificationType.POST:
            message = <><Text className="font-spartan-bold">{name}</Text> publicó en tu perfil</>;
            icon = <FontAwesome name="comment-o" size={20} color={`${isDark ? "#AA3E14" : "#FF9B42"}`} />
            break;
        case NotificationType.FOLLOW:
            message = <><Text className="font-spartan-bold">{name}</Text> comenzó a seguirte</>;
            icon = <SimpleLineIcons name="user-follow" size={20} color={`${isDark ? "#115A67" : "#30C2D9"}`} />
            break;
        case NotificationType.MENTION:
            message = <><Text className="font-spartan-bold">{name}</Text> te mencionó en un comentario</>;
            icon = <Octicons name="mention" size={20} color={`${isDark ? "#115A67" : "#30C2D9"}`} />
            break;
    }

    return (
        <TouchableOpacity
            className={`flex-row items-center w-full ${unread ? "bg-[#30C2D9]/5 dark:bg-background-semidark/70" : "bg-background-light dark:bg-background-semidark"} px-4 py-5 border-y border-[#e6e6e6] dark:border-[#404b65]`}
            activeOpacity={0.7}
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
            }}
        >
            <View className="mr-3 relative">
                <ProfileIcon initials={initials} isDark={isDark} />

                {/* Icono */}
                <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-background-light dark:border-background-semidark bg-background-light dark:bg-background-dark items-center justify-center">
                    { icon }
                </View>
            </View>
            
            {/* Info */}
            <View className="flex-1">
                <Text className="text-base text-[#2C2C2C] dark:text-background-light font-spartan">
                    {message}
                </Text> 
                <Text className="text-sm text-[#6B6B6B] font-spartan">{time}</Text>
            </View>

            {unread && (
                <View 
                    className="justify-end w-3 h-3 ml-3 bg-primary-light rounded-full dark:bg-tertiary-dark"
                ></View>
            )}
        </TouchableOpacity>
    )
}

export default NotificationCard
