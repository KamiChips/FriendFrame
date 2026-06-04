import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import "../../global.css";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { router, Stack } from "expo-router";
import {
  signIn,
  signInWithGoogle,
} from "@/services/supabase/auth/auth.sign-in";
import { LOCATION_ID } from "expo-router/build/rsc/router/common";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);
    const { data, error: authError } = await signIn({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError);
      return;
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    const { error: authError } = await signInWithGoogle(
      "frontend://auth/callback",
    );

    setLoading(false);

    if (authError) {
      setError(authError);
    }
  };

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
          {/* Welcome back */}
          <View className="mb-20">
            <Text className="text-background-dark dark:text-background-light text-4xl font-bold">
              Welcome Back!
            </Text>
            <Text className="text-background-dark dark:text-background-light text-xl">
              See what your friends shared about you
            </Text>
          </View>

          {/* Login form */}
          <View className="mb-18">
            <TextField
              testID="username-textfield"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />

            <TextField
              testID="password-textfield"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Remember me / Forgot Password? */}
            <View className="flex-row justify-between mb-12">
              <Text className="dark:text-background-light">[] Remember me</Text>{" "}
              {/* Hay que cambiar esto por un checkbox :P */}
              <Text className="font-semibold dark:text-background-light">
                Forgot Password?
              </Text>
            </View>

            <View className="items-center mb-18 mt-12">
              <Button
                testID="login-button"
                variant={isDark ? "primary" : "secondary"}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator testID="loading-indicator" />
                ) : (
                  <Text>Iniciando Sesión</Text>
                )}
              </Button>
            </View>
          </View>

          {/* Login with Google or Sign up */}
          <View className="items-center mb-4 mt-8">
            <Text className="dark:text-background-light mb-10">
              Log in with
            </Text>
            <TouchableOpacity
              testID="google-signin-button"
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {/* Google Logo */}
              <Image source={require("../../assets/images/google-logo.png")} />
            </TouchableOpacity>
            <Text className="dark:text-background-light mt-10">
              Don't have an account?{" "}
              <Text
                className="font-semibold dark:text-background-light"
                onPress={() => router.push("/(auth)/signup")}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </View>
      </LinearGradient>
    </>
  );
}
