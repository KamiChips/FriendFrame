import {TextInput, TextInputProps} from 'react-native';
import '../../global.css';

export function TextField({placeholder, ...props}: TextInputProps) {
    return (
       <TextInput placeholder={placeholder} 
       className="py-2 text-[#1D2A4F] font-semibold border-b-2 border-[#1D2A4F]"/>
    )
}
