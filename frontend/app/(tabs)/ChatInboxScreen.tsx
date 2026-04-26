import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import '../../global.css';

const ChatInboxScreen = () => {

    const colorScheme = useColorScheme();
    const isDark = false;
    // colorScheme === 'dark';

    /*
        DIVISION DE LA PANTALLA
        
        Header: Hacer Componente?
            - Logo FriendFrame
            - Campana Notificaciones
        Inbox:
            - Titulo "Mensajes"
            - ChatBox: Hacer Componente
                - UserProfilePicture (Con punto si hay mensajes no leidos)
                - UserInfo:
                    - Nombre
                    - Mensaje mas reciente
                - Tiempo desde que mando el último mensaje
        Barra de Navegacion inferior - No poner en este componente
    */

    return (
        <View className="flex-1 bg-background-gray mt-2">
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            {/* <View className="flex-row items-center justify-between bg-background-light px-5 pb-3 pt-4">
                <Text className="font-bold text-2xl italic tracking-wider">FriendFrame</Text>
                
            </View> */}

            {/* Inbox */}
            <View className="flex-1 bg-gray-50">
                <View className="px-4 pt-5 pb-3">
                    <Text className="font-bold text-2xl text-[#1a1a1a]">
                        Mensajes
                    </Text>
                </View>

                <ScrollView className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Chats */}
                    <TouchableOpacity
                        className="flex-row items-center bg-background-light mx-4 mb-3 px-4 py-3 rounded-2xl"
                        activeOpacity={0.7}
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                            elevation: 2,
                        }}
                    >
                        {/* Perfil de usuario */}
                        <TouchableOpacity>
                            <View className="mr-3">
                                <LinearGradient  
                                    colors={
                                        isDark ? ["#182240", "#115A67", "#AA3E14"] 
                                        : ["#FAFAFA", "#30C2D9", "#FF9B42"]
                                    }
                                    style={{
                                        width: 48,
                                        height: 40,
                                        alignItems: 'center',
                                        justifyContent: "center",
                                        borderRadius: "50%",  
                                    }}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0.7, y: 0.7 }}
                                >
                                    <Text className="text-background-light font-semibold">CR</Text>
                                </LinearGradient>
                            </View>
                        </TouchableOpacity>
                        
                        {/* Info del Chat */}
                        <View className="flex-1">
                            <Text className="font-semibold text-[#1a1a1a] mb-0.5">Carlos Ramirez</Text> {/* Nombre usuario */}
                            <Text className="text-sm text-[#888]">Claro! Nos vemos mañana</Text> {/* Mensaje */}
                        </View>

                        <Text className="text-xs text-[#aaa] ml-2">Hace 10 min</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    )
}

export default ChatInboxScreen
