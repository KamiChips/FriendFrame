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
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            className={`px-6 ${isDark ? 'dark' : ''}`}
            colors={
                isDark ? ["#182240", "#115A67", "#AA3E14"] 
                : ["#FAFAFA", "#30C2D9", "#FF9B42"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View className='w-3/4 self-center'>
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
                    <View className="flex-row justify-between mb-12">
                        <Text className='dark:text-background-light'>[] Remember me</Text>
                        <Text className='font-semibold dark:text-background-light'>Forgot Password?</Text>
                    </View>

                    <View className='items-center mb-18 mt-12'>
                        <Button 
                            title="Log In" 
                            variant={isDark ? 'primary' : 'secondary'} 
                            onPress={handleSubmit} 
                        />
                    </View>
                </View>

                {/* Login with Google or Sign up */}
                <View className='items-center mb-4 mt-8'>
                    <Text className='dark:text-background-light mb-4'>
                        Log in with
                    </Text>
                    <TouchableOpacity onPress={logInWithGoogle} >
                        {/* Google Logo */}
                        <Image 
                            source={require('../../assets/images/google-logo.png')}
                        />
                    </TouchableOpacity>
                    <Text className='dark:text-background-light mt-4'>
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
