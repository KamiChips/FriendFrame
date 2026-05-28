import {Animated, TextInput, TextInputProps, useColorScheme, View} from 'react-native';
import '../../global.css';
import { useEffect, useRef, useState } from 'react';

export function TextField({placeholder, value, onFocus, onBlur, onChangeText, ...props}: TextInputProps) {

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [text, setText] = useState(value ||'');
    const [isFocused, setIsFocused] = useState(false);

    //Sincroniza el valor externo con el interno
    useEffect(() => {
        if (value)
            setText(value);
    }, [value]);

    // Animación para el label flotante 0 = placeholder, 1 = flotando
    const animateFocus = useRef(new Animated.Value(text !== '' ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animateFocus, {
            toValue: isFocused || text !== '' ? 1 : 0,
            duration: 200,
            useNativeDriver: false
        }).start();
    }, [isFocused, text]);

    // Interpolación para el label flotante
    const labelTop = animateFocus.interpolate({
        inputRange: [0, 1],
        outputRange: [12, -12]
    });

    // Interpolación para el tamaño del label
    const labelFontSize = animateFocus.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 12] // Cambia el tamaño del label al flotar
    });

    const labelColor = animateFocus.interpolate({
        inputRange: [0, 1],
        outputRange: [
            isDark ? '#FAFAFA' : '#182240', // Color del label cuando está en placeholder
            isDark ? '#30C2D9' : '#FF9B42' // Cambia el color del label al flotar
        ] 
    });

    return (
       <View className="w-full mb-4">
            <Animated.Text
                style={{
                    position: 'absolute',
                    left: 0,
                    top: labelTop,
                    fontSize: labelFontSize,
                    color: labelColor,
                }}
                className="font-medium"
            >
                {placeholder}
            </Animated.Text>

            <TextInput
                {...props}
                value={text}
                onChangeText={(val) => {
                    setText(val);
                    onChangeText && onChangeText(val);
                }}
                onFocus={(e) => {
                    setIsFocused(true);
                    if (onFocus) onFocus(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    if (onBlur) onBlur(e);
                }}
                placeholder="" className="py-2 text-[#1D2A4F] font-semibold border-b-2 border-[#1D2A4F] dark:text-background-light dark:border-background-light"
            />
       </View>
    )
}
