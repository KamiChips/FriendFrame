import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps extends TextInputProps {
  placeholder?: string;
}

export default function SearchBar({ placeholder = "Buscar...", ...props }: SearchBarProps) {
  return (
    // Agregamos items-center para que el ícono y el texto se alineen perfectamente
    <View className="flex-row items-center h-12 bg-gray-200 dark:bg-[#1D2A4F] border border-transparent dark:border-gray-600 rounded-xl px-3">
      <Ionicons name="search" size={20} color="#8A8A8E" />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#8A8A8E"
        // Quitamos las alturas y dejamos que flex haga su trabajo
        className="flex-1 ml-2 font-spartan text-base text-background-dark dark:text-white"
        {...props}
      />
    </View>
  );
}