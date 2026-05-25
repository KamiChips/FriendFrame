import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import '../../global.css';

interface NotificationButtonProps {
    hasUnreadNotifications?: boolean,
    isDark: boolean,
}

const NotificationButton = ({ isDark, hasUnreadNotifications = true }: NotificationButtonProps) => {
    return(
        <TouchableOpacity className='relative' onPress={() => console.log("Open notifications")}>
            <Ionicons
                name='notifications-outline'
                size={28}
                color={isDark ? '#fafafa' : ' #000000'}
            />

            {/* Puntito de no leido */}
            {hasUnreadNotifications && (
                <View 
                    className="absolute -top-1 -right-1 w-4 h-4 bg-primary-dark rounded-full  dark:bg-secondary-dark"
                >
                </View>
            )}
        </TouchableOpacity>
    );
}

export default NotificationButton;
