import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import '../../global.css';

const GoBackButton = ({
    isDark,
    onPress,
}: {
    isDark: boolean;
    onPress?: () => void;
}) => {
    return (
        <TouchableOpacity className="p-2" onPress={onPress}>
            <Ionicons
                name="arrow-back"
                size={32}
                color={isDark ? '#FAFAFA' : '#000000'}
            />
        </TouchableOpacity>
    );
};

export default GoBackButton;
