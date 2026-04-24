import React from 'react';
import { View, StyleSheet, ActivityIndicator, Image, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      
      {/* Fondo base: El degradado con los colores del light mode*/}
      <LinearGradient
        colors={['#E1F4FA', '#FDE0C7']} 
        style={StyleSheet.absoluteFill}
      />

      {/* Los marcos de fotos que cubren toda la pantalla. 
          Usamos ImageBackground en lugar de Image para forzar que ocupe el 100% no deje bordes vacíos. */}
      <ImageBackground
        source={require('../../assets/images/FondoSplash.png')} 
        style={StyleSheet.absoluteFill}
        imageStyle={styles.patternOpacity}
        resizeMode="cover" 
      >
        {/* Contenedor central: Agrupa el logo, el texto y el spinner.
            Al usar Flexbox aquí, aseguramos que siempre esté centrado en el celular y en la PC. */}
        <View style={styles.contentContainer}>
          
          {/* Logo principal, la de los personajes */}
          <Image
            source={require('../../assets/images/logoSplash.png')} 
            style={styles.mainLogo}
            resizeMode="contain"
          />

          {/* Texto de FriendFrame */}
          <Image
            source={require('../../assets/images/friendframe.png')}
            style={styles.textLogo}
            resizeMode="contain"
          />

          {/* Animación de carga */}
          <ActivityIndicator 
            size="large" 
            color="#2A8290" 
            style={styles.spinner}
          />
          
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  patternOpacity: {
    opacity: 0.9, 
    width: '100%', 
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',   
    marginTop: -160, 
  },
  mainLogo: {
    // El logo con las personitas
    width: 800,
    height: 600,
    // Pegamos el logo al texto que está abajo
    marginBottom: -220, 
  },
  textLogo: {
    width: 250, 
    height: 60,
    marginBottom: 20, 
    zIndex: 10
  },
  spinner: {
    marginTop: 10,
  },
});