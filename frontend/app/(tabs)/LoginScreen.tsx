import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text } from 'react-native';
import '../../global.css';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';

const LoginScreen = () => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
        console.log("Login with username: ", username);
    }

    return (
        <LinearGradient
            className="flex-1 justify-center px-6"
            colors={["#FAFAFA", "#30C2D9", "#FF9B42"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Welcome back */}
            <View className="mb-8">
                <Text className="text-background-dark text-4xl font-bold">
                Welcome Back!
                </Text>
                <Text className="text-background-dark text-xl">
                See what your friends shared about you
                </Text>
            </View>

            {/* Login form */}
            <View className="space-y-4">
                <TextField
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                />

                <TextField
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {/* remember me */}
                <View className="flex-row justify-between">
                    <Text>[] Remember me</Text>
                    <Text className='font-semibold'>Forgot Password?</Text>
                </View>

                <View className='items-center'>
                    <Button title="Log In" variant='secondary' onPress={handleSubmit} />
                </View>
            </View>

            {/* Login with Google or Sign up */}
            <View className='items-center'>
                <Text>
                    Log in with
                </Text>
                {/* Google Icon */}
                <Text>
                    Don't have an account? {" "}
                    <Text className='font-semibold' onPress={() => console.log("go to sign up screen")}>
                        Sign up
                    </Text>
                </Text>
            </View>
        </LinearGradient>
    ) 
}

export default LoginScreen
