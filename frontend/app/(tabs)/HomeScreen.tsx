import { Link } from 'expo-router';
import '../../global.css';
import { Button } from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, Text, useColorScheme } from 'react-native';

export default function HomeScreen() {
  const isDark = useColorScheme() === 'dark';

  return (
    <LinearGradient
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      className={`px-6 ${isDark ? 'dark' : ''}`}
      colors={
        isDark ? ["#182240", "#115A67", "#AA3E14"]
          : ["#FAFAFA", "#30C2D9", "#FF9B42"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >

      <View className="mb-20">
        <Text className="text-4xl mb-40 font-borel">
          FriendFrame
        </Text>

        <Link href="/SignupScreen" asChild>
          <Button title="Get Started" variant="secondary" onPress={function (): void {
          }} />
        </Link>

        <Link href="/LoginScreen" asChild>
          <Button title="Have an Account?" onPress={() => { }} variant="primary" />
        </Link>
      </View>

    </LinearGradient>
  );
}