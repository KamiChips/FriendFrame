import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { TextField } from "@/components/ui/TextField";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

export interface Credentials {
  email: string;
  password: string;
}

export interface LoginScreenProps {
  // motivo por el que no se pudo entrar; reemplaza el lema
  errorMessage?: string;
  onSubmit?: (credentials: Credentials) => void;
  onForgotPassword?: () => void;
}

export function LoginScreen({ errorMessage, onSubmit, onForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View className="min-h-screen flex-1 items-center justify-center gap-7 bg-canvas-light dark:bg-canvas-dark">
      <View className="absolute right-10 top-8">
        <ThemeSelector />
      </View>

      <Card radius="lg" className="w-[464px] gap-7 p-10">
        <View className="items-center gap-[9px]">
          <View>
            <BrandLogo size={40} />
          </View>
          <Text className="font-spartan-bold text-[27px] leading-8 text-ink-light dark:text-ink-dark">
            Panel de moderación
          </Text>
          {errorMessage ? (
            <Text
              accessibilityRole="alert"
              className="font-spartan-bold text-base leading-[19px] text-onNoticeSoft-light dark:text-onNoticeSoft-dark"
            >
              {errorMessage}
            </Text>
          ) : (
            <Text className="font-spartan text-base leading-[19px] text-muted-light dark:text-muted-dark">
              Un espacio seguro empieza contigo.
            </Text>
          )}
        </View>

        <View className="gap-5">
          <TextField
            label="Correo"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="¿Olvidaste tu contraseña?"
            onPress={onForgotPassword}
            className="self-start"
          >
            <Text className="font-spartan text-sm leading-[17px] text-link-light dark:text-link-dark">
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>
          <Button
            label="Iniciar sesión"
            fullWidth
            onPress={() => onSubmit?.({ email, password })}
          />
        </View>

        <View className="flex-row items-center justify-center gap-2">
          <Icon name="shield-check" size={16} tone="faint" />
          <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
            Solo para el equipo de FriendFrame
          </Text>
        </View>
      </Card>

      <Text className="font-spartan text-[13px] leading-4 text-muted-light dark:text-muted-dark">
        FriendFrame · Moderación con contexto y empatía
      </Text>
    </View>
  );
}
