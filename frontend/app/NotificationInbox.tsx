import { ScrollView, StatusBar, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import '../global.css';
import GoBackButton from "../components/ui/GoBackButton";
import NotificationCard, { NotificationCardProps, NotificationType } from "../components/ui/NotificationCard";

const NotificationInbox = () => {
    /* 
        Header:
            Back arrow
            Notificaciones
        Inbox:
            NotificationCard
                PFP + Icon (Like, Comment, Post, Follow, Mention)
                Background and dot if unread
    */

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const NOTIFS: NotificationCardProps[] = [
        {
            "id": 1,
            "name": "Carlos Ramirez",
            "initials": "CR",
            "time": "Hace 5 min",
            "unread": true,
            "notificationType": NotificationType.LIKE,
            "isDark": isDark,
        },
        {
            "id": 2,
            "name": "Ana López",
            "initials": "AL",
            "time": "Hace 15 min",
            "unread": true,
            "notificationType": NotificationType.COMMENT,
            "isDark": isDark,
            "comment": "Me encanta esta foto!"
        },
        {
            "id": 3,
            "name": "Laura Ruiz",
            "initials": "LR",
            "time": "Hace 1 hora",
            "unread": false,
            "notificationType": NotificationType.POST,
            "isDark": isDark,
        },
        {
            "id": 4,
            "name": "Diego Silva",
            "initials": "DS",
            "time": "Hace 2 horas",
            "unread": false,
            "notificationType": NotificationType.FOLLOW,
            "isDark": isDark,
        },
        {
            "id": 5,
            "name": "Carlos Ramirez",
            "initials": "CR",
            "time": "Hace 3 horas",
            "unread": false,
            "notificationType": NotificationType.MENTION,
            "isDark": isDark,
        },
    ]

    return (
        <SafeAreaView className={`flex-1 bg-background-light ${isDark ? 'dark' : ''} dark:bg-background-dark `}>
            <StatusBar 
                barStyle={isDark ? 'light-content' : 'dark-content'} 
                backgroundColor={isDark ? '#1a1a1a' : "#ffffff"}
            />

            {/* Header */}
            <View className="flex-row pl-1 pb-1 dark:bg-background-dark dark:opacity-100 border-b border-[#e6e6e6] dark:border-[#404b65]">
                <GoBackButton isDark={isDark} />

                <Text className="font-spartan-bold dark:text-background-light text-3xl self-center">Notificaciones</Text>
            </View>

            <View className="flex-1 bg-gray-50 dark:bg-background-dark">
                <ScrollView className="flex-1"
                    showsVerticalScrollIndicator={isDark}
                >
                    {/* Notificartions */}
                    {NOTIFS.map(notif => (
                        <NotificationCard key={notif.id} {...notif} isDark={isDark} />
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

export default NotificationInbox
