import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, TouchableOpacity, Image, useColorScheme } from 'react-native';
import '../../global.css';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';

const LoginScreen = () => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleSubmit = () => {
        console.log("Login with username: ", username);
    }

    const logInWithGoogle = () => {
        console.log("Logging in with Google");
    }

    return (
        <LinearGradient
            className={`flex-1 justify-center items-center px-6 space-y-4 ${isDark ? 'dark' : ''}`}
            colors={
                isDark ? ["#182240", "#115A67", "#AA3E14"] 
                : ["#FAFAFA", "#30C2D9", "#FF9B42"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View className='w-4/5 justify-center space-y-6'>
                {/* Welcome back */}
                <View className="mb-8">
                    <Text className="text-background-dark dark:text-background-light text-4xl font-bold">
                    Welcome Back!
                    </Text>
                    <Text className="text-background-dark dark:text-background-light text-xl">
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

                    {/* Remember me / Forgot Password? */}
                    <View className="flex-row justify-between">
                        <Text className='dark:text-background-light'>[] Remember me</Text>
                        <Text className='font-semibold dark:text-background-light'>Forgot Password?</Text>
                    </View>

                    <View className='items-center'>
                        <Button 
                            title="Log In" 
                            variant={isDark ? 'primary' : 'secondary'} 
                            onPress={handleSubmit} 
                        />
                    </View>
                </View>

                {/* Login with Google or Sign up */}
                <View className='items-center space-y-4'>
                    <Text className='dark:text-background-light'>
                        Log in with
                    </Text>
                    <TouchableOpacity onPress={logInWithGoogle} >
                        {/* Google Logo */}
                        <Image 
                            source={require('../../assets/images/google-logo.png')}
                        />
                    </TouchableOpacity>
                    <Text className='dark:text-background-light'>
                        Don't have an account? {" "}
                        <Text className='font-semibold dark:text-background-light' onPress={() => console.log("go to sign up screen")}>
                            Sign up
                        </Text>
                    </Text>
                </View>
            </View>
        </LinearGradient>
    ) 
}

export default LoginScreen
