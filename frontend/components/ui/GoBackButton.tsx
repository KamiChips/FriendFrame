import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import '../../global.css';

const GoBackButton = ({isDark}: {isDark:boolean}) => {
    return (
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
            <Ionicons
                name='arrow-back'
                size={32}
                color={ isDark ? "#FAFAFA" : '#000000'}
            />
        </TouchableOpacity>
    )
}

export default GoBackButton
