import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, TouchableOpacity, Image, useColorScheme, Modal, ScrollView, Alert, SafeAreaView } from 'react-native';
import '../../global.css';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { TERMS_AND_SERVICES_TEXT } from '../../constants/termsText';

const SignUpScreen = () => {

    const [fullname, setFullname] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const validateTerms = () => {
        if (!isTermsAccepted) {
            Alert.alert(
                "Aviso Legal",
                "Para poder utilizar FriendFrame, es obligatorio leer y aceptar los Términos de Servicio y la Política de Privacidad."
            );
            return false;
        }
        return true;
    };

    const handleSubmit = () => {
        if (!validateTerms()) return;
        console.log("Sign up with fullname: ", fullname, " username: ", username, " email: ", email, " password: ", password);
    }

    const signUpWithGoogle = () => {
        if (!validateTerms()) return;
        console.log("Sign up with Google");
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
                <View className="mb-14">
                    <Text className="text-background-dark dark:text-background-light text-4xl font-bold">
                        Get Started!
                    </Text>
                    <Text className="text-background-dark dark:text-background-light text-xl mt-1">
                        Let your friends tell your story
                    </Text>
                </View>

                {/* Sign up form */}
                <View className="mb-6">
                    <TextField placeholder="Full Name" value={fullname} onChangeText={setFullname} />
                    <TextField placeholder="Username" value={username} onChangeText={setUsername} />
                    <TextField placeholder="Email" value={email} onChangeText={setEmail} />
                    <TextField placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

                    {/* Checkbox de Términos */}
                   <View className="flex-row items-center justify-start w-full my-4 pr-2">
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            onPress={() => setIsTermsAccepted(!isTermsAccepted)}
                            className={`w-5 h-5 rounded border mr-3 justify-center items-center ${
                                isTermsAccepted 
                                    ? 'bg-background-dark dark:bg-background-light border-background-dark dark:border-background-light' 
                                    : 'border-background-dark/40 dark:border-background-light/40'
                            }`}
                        >
                            {isTermsAccepted && (
                                <Text className="text-background-light dark:text-background-dark font-bold text-xs">✓</Text>
                            )}
                        </TouchableOpacity>

                        <Text className="text-background-dark dark:text-background-light text-sm flex-row items-center">
                            Acepto los{' '}
                            <Text 
                                onPress={() => setModalVisible(true)} 
                                className="font-bold underline text-background-dark dark:text-background-light"
                            >
                                Términos de Servicio y Privacidad
                            </Text>
                        </Text>
                    </View>

                    <View className='items-center mb-6 mt-4'>
                        <Button 
                            title="Sign Up" 
                            variant={isDark ? 'primary' : 'secondary'} 
                            onPress={handleSubmit} 
                        />
                    </View>
                </View>

                {/* Autenticación Alternativa */}
                <View className='items-center mb-4 mt-2'>
                    <Text className='dark:text-background-light mb-4'>Sign up with</Text>
                    <TouchableOpacity onPress={signUpWithGoogle} >
                        <Image source={require('../../assets/images/google-logo.png')} />
                    </TouchableOpacity>
                    <Text className='dark:text-background-light mt-6'>
                        Already have an account? {" "}
                        <Text className='font-semibold dark:text-background-light' onPress={() => console.log("/LoginScreen")}>
                            Log In
                        </Text>
                    </Text>
                </View>
            </View>

            {/* Términos y Servicios */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <SafeAreaView className="bg-white dark:bg-slate-900 h-[80%] rounded-t-3xl p-6 shadow-2xl">
                        
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <View>
                                <Text className="text-xl font-bold text-slate-900 dark:text-white">Aviso Legal y Privacidad</Text>
                                <Text className="text-xs text-slate-400 mt-0.5">FriendFrame — Carta de Responsabilidades</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setModalVisible(false)}
                                className="bg-slate-100 dark:bg-slate-800 rounded-full w-8 h-8 items-center justify-center"
                            >
                                <Text className="text-slate-500 dark:text-slate-400 font-bold">✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView className="flex-1 pr-1" showsVerticalScrollIndicator={true}>
                            <Text className="text-xs text-slate-400 mb-3 font-mono">{TERMS_AND_SERVICES_TEXT.version}</Text>
                            
                            <Text className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-justify mb-4">
                                {TERMS_AND_SERVICES_TEXT.intro}
                            </Text>

                            {TERMS_AND_SERVICES_TEXT.sections.map((section) => (
                                <View key={section.id} className="mb-4">
                                    <Text className="font-bold text-slate-900 dark:text-white text-base mb-1">
                                        {section.title}
                                    </Text>
                                    <Text className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                                        {section.content}
                                    </Text>
                                </View>
                            ))}

                            <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-justify">
                                {TERMS_AND_SERVICES_TEXT.footer}
                            </Text>
                        </ScrollView>

                        {/* Botón de salida */}
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            onPress={() => setModalVisible(false)}
                            className="mt-4 bg-slate-900 dark:bg-slate-100 py-3.5 rounded-xl items-center"
                        >
                            <Text className="text-white dark:text-slate-900 font-semibold text-sm">Entendido</Text>
                        </TouchableOpacity>

                    </SafeAreaView>
                </View>
            </Modal>
        </LinearGradient>
    ) 
}

export default SignUpScreen;