import React from 'react';
import { View, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileTabsProps {
  activeTab: 'grid' | 'list';
  onTabChange: (tab: 'grid' | 'list') => void;
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-row border-b border-gray-200 dark:border-gray-800 mt-2">
      <TouchableOpacity 
        className={`flex-1 items-center py-4 ${activeTab === 'grid' ? 'border-b-2 border-primary-light dark:border-white' : ''}`}
        onPress={() => onTabChange('grid')}
      >
        <Ionicons 
          name="grid-outline" 
          size={24} 
          color={activeTab === 'grid' ? (isDark ? 'white' : 'black') : '#8A8A8E'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        className={`flex-1 items-center py-4 ${activeTab === 'list' ? 'border-b-2 border-primary-light dark:border-white' : ''}`}
        onPress={() => onTabChange('list')}
      >
        <Ionicons 
          name="list-outline" 
          size={26} 
          color={activeTab === 'list' ? (isDark ? 'white' : 'black') : '#8A8A8E'} 
        />
      </TouchableOpacity>
    </View>
  );
}