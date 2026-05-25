import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import '../../global.css';
import NotificationButton from './NotificationButton';

const HeaderWithLogoAndNotificationBell = ({ isDark }: { isDark: boolean }) => {
    return (
        <View className="flex-row items-center justify-between bg-background-light px-5 pb-3 pt-2 dark:bg-background-semidark">
            <Text className="font-bold text-2xl italic tracking-wider dark:text-background-light">FriendFrame</Text>
            <NotificationButton isDark={isDark} />
        </View>
    );
}

export default HeaderWithLogoAndNotificationBell;
