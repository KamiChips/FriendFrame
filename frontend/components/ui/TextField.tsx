import {TextInput, TextInputProps, useColorScheme} from 'react-native';
import '../../global.css';

export function TextField({placeholder, ...props}: TextInputProps) {

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
       <TextInput placeholder={placeholder} 
       className="py-2 text-[#1D2A4F] font-semibold border-b-2 border-[#1D2A4F] mb-4 dark:text-background-light dark:border-background-light"/>
    )
}
