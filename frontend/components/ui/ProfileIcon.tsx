import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native";

interface ProfileIconProps {
    initials: string,
    size?: number,
    isDark: boolean
}

const ProfileIcon = ({ initials, isDark, size = 48 }: ProfileIconProps) => {
    return (
        <LinearGradient  
            colors={
                isDark ? ["#182240", "#AA3E14", "#115A67"] 
                : ["#FAFAFA", "#30C2D9", "#FF9B42"]
            }
            style={{
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: "center",
                borderRadius: "50%",  
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 0.7 }}
        >
            <Text className="text-background-light font-semibold font-spartan-bold">{initials}</Text>
        </LinearGradient>
    );
}

export default ProfileIcon;
