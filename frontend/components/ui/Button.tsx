import '../../global.css';
import { Text, TouchableOpacity } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

export function Button({ title, onPress, variant = "primary" }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`w-[214px] py-3 rounded-full items-center
        ${variant === "primary" 
          ? "bg-[#1D2A4F]" 
          : "bg-[#E5E7EB] border-2 border-[#1D2A4F]"} mb-4 mt-3"
        }
      `}
    >
      <Text
        className={`font-semibold text-base
          ${variant === "primary" 
            ? "text-white" 
            : "text-[#1D2A4F]"
          }
        `}
      >
        {title}
      </Text>
      
    </TouchableOpacity>
  );
}