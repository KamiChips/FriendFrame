import {TextInput} from 'react-native';
import '../../global.css';

export function TextField({placeholder}: {placeholder?: string}) {
    return (
       <TextInput placeholder={placeholder} 
       className="py-2 text-[#1D2A4F] font-semibold border-b-2 border-[#1D2A4F]"/>
    )
}
