import { View, Text } from 'react-native';
import '../../global.css';
import NotificationButton from './NotificationButton';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const FriendframeHeader = ({ isDark }: { isDark: boolean }) => {
    return (
        <View className="flex 1 flex-row items-center justify-between bg-background-light px-5 pt-2 dark:bg-background-semidark border-b border-[#e6e6e6] dark:border-[#404b65]">
            <MaskedView
                maskElement={
                    <Text
                        className="text-3xl font-borel"
                        style={{ lineHeight: 50 }}
                    >
                        FriendFrame
                    </Text>
                }
            >
                <LinearGradient
                    colors={isDark ? ["#AA3E14", "#115A67"] 
                        : ["#30C2D9", "#FF9B42"] 
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text
                        className="text-3xl font-borel opacity-0"
                        style={{ lineHeight: 50 }}
                    >
                        FriendFrame
                    </Text>
                </LinearGradient>
            </MaskedView>
            <NotificationButton isDark={isDark} />
        </View>
    );
}

export default FriendframeHeader;
