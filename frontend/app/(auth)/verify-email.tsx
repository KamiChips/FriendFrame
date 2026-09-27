import React, { useState, useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
    View,
    Text,
    useColorScheme,
} from "react-native";
import "../../global.css";
import { Button } from "../../components/ui/Button";
import { router, Stack } from "expo-router";
import {
    resendVerificationEmail,
    RetryLimitError
} from "@/services/supabase/auth/auth.helpers";
import { useAuth } from "@/context/AuthContext";
import { Message } from '../../services/supabase/chat/chat.types';

export default function VerifyEmailScreen() {
    const [secondsLeft, setSecondsLeft] = useState(0);
    const timerRef = useRef(0);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const { user, refreshUser } = useAuth();

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
    }

    const handlePress = async () => {
        try {
            await resendVerificationEmail(user?.email);
            countdown(60);
        } catch( error ) {
            const msg = (error as Error).message;
            if (error instanceof RetryLimitError) countdown(error.retryAfterSeconds);
            console.error("Error while sending email verification", msg);
        }
    }

    const checkEmailVerificationStatus = async () => {
        try {
            await refreshUser();
        } catch (error) {
            console.error("Error al checar la verificación de correo.", error);
        }
    }

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        checkEmailVerificationStatus();
        const interval = setInterval(checkEmailVerificationStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const isButtonDisabled = secondsLeft > 0
    
    return (
        <>
            <Stack.Screen
                options={{
                headerTransparent: true,
                headerTitle: "",
                headerTintColor: isDark ? "#FAFAFA" : "#182240",
                }}
            />

            <LinearGradient
                style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                className={`px-6 ${isDark ? "dark" : ""}`}
                colors={
                isDark
                    ? ["#182240", "#115A67", "#AA3E14"]
                    : ["#FAFAFA", "#30C2D9", "#FF9B42"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View className="w-3/4 self-center">
                    {/* Texto de verificación por email */}
                    <View className="mb-20">
                        <Text className="text-background-dark dark:text-background-light text-4xl font-bold">
                            Correo de verificación envíado
                        </Text>
                        <Text className="text-background-dark dark:text-background-light text-xl">
                            Hemos enviado un enlace de verificación a tu correo { user?.email }. Ingresa al enlace para verificar tu cuenta.
                        </Text>
                    </View>

                    {/* Botón de reenvío */}
                    <View className="w-3/4 self-center">
                        <Text>
                            ¿No recibiste el correo? 
                        </Text>
                        <Button 
                            title={isButtonDisabled ? `Reintentar en (${secondsLeft}s)` : "Reenviar correo"}
                            onPress={ handlePress } 
                            disabled={ isButtonDisabled } 
                        />
                    </View>

                    {/* Link de cambio de email */}
                    <View>
                        <Text>
                            ¿No recibiste el email? Cambiar email
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </>
    );
}
