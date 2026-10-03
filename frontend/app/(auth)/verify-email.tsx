import React, { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, useColorScheme } from 'react-native';
import '../../global.css';
import { Button } from '../../components/ui/Button';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
    resendVerificationEmail,
    RetryLimitError,
} from '@/services/supabase/auth/auth.helpers';
import { useAuth } from '@/context/AuthContext';
import { Feather } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
    const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
    const [secondsLeft, setSecondsLeft] = useState(0);
    const timerRef = useRef(0);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { user, refreshUser } = useAuth();

    const email = user?.email ?? emailParam;
    const hasSession = !!user;

    const countdown = (sec: number) => {
        setSecondsLeft(sec);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handlePress = async () => {
        try {
            await resendVerificationEmail(email);
            countdown(60);
        } catch (error) {
            const msg = (error as Error).message;
            if (error instanceof RetryLimitError)
                countdown(error.retryAfterSeconds);
            console.error('Error while sending email verification', msg);
        }
    };

    const checkEmailVerificationStatus = async () => {
        try {
            await refreshUser();
        } catch (error) {
            console.error('Error al checar la verificación de correo.', error);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!hasSession) return;

        checkEmailVerificationStatus();
        const interval = setInterval(checkEmailVerificationStatus, 5000);
        return () => clearInterval(interval);
    }, [hasSession]);

    const isButtonDisabled = secondsLeft > 0;

    return (
        <>
            <Stack.Screen
                options={{
                    headerTransparent: true,
                    headerTitle: '',
                    headerTintColor: isDark ? '#FAFAFA' : '#182240',
                }}
            />

            <LinearGradient
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                className={`px-6 ${isDark ? 'dark' : ''}`}
                colors={
                    isDark
                        ? ['#182240', '#115A67', '#AA3E14']
                        : ['#FAFAFA', '#30C2D9', '#FF9B42']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View className="w-full max-w-sm items-center">
                    {/* Icono */}
                    <View className="w-20 h-20 rounded-full bg-white/20 dark:bg-black/20 items-center justify-center mb-8">
                        <Feather
                            name="mail"
                            size={32}
                            color={isDark ? '#30C2D9' : '#115A67'}
                        />
                    </View>

                    {/* Texto de verificación por email */}
                    <View className="items-center mb-10">
                        <Text className="text-background-dark dark:text-background-light text-3xl font-bold text-center mb-3">
                            Verification email sent
                        </Text>
                        <Text className="text-background-dark dark:text-background-light text-base text-center opacity-80 max-w-xs">
                            We sent a verification link to your email: {email}.
                            Please open the link to verify your account.
                        </Text>
                    </View>

                    {/* Botón de reenvío */}
                    <View className="w-full items-center mb-6">
                        <Text className="text-background-dark dark:text-background-light text-sm opacity-70 mb-2">
                            Didn't receive an email?
                        </Text>
                        <Button
                            title={
                                isButtonDisabled
                                    ? `Retry in (${secondsLeft}s)`
                                    : 'Resend email'
                            }
                            onPress={handlePress}
                            disabled={isButtonDisabled}
                        />
                    </View>

                    {/* Link de cambio de email */}
                    <View className="items-center">
                        <Text className="text-background-dark dark:text-background-light text-sm opacity-70">
                            Wrong email? Change email here!
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </>
    );
}
