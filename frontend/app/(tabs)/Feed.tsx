import React, { useState } from "react";
import { ScrollView, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Importación de nuestros componentes personalizados de UI
import FeedCard from "@/components/ui/FeedCard";
import FriendframeHeader from "@/components/ui/FriendframeHeader";
import { CommentType } from "@/components/ui/CommentItem";

export default function FeedScreen() {
  // Detecta si el celular del usuario está en modo oscuro para adaptar los colores
  const isDark = useColorScheme() === "dark";

 
  // 1. GESTIÓN DE ESTADOS LOCALES (MOCK DATA)
  // Aquí almacenamos la información de los comentarios en tiempo real.
  // Al usar useState, React actualizará la pantalla automáticamente si estos cambian.
 

  // Estado que guarda la lista de comentarios exclusivos de la publicación de Ana.
  const [comentariosAna, setComentariosAna] = useState<CommentType[]>([
    {
      id: "1",
      authorName: "María González",
      authorInitials: "MG",
      content: "Para bailar la bamba se necesita una poca de gracia",
      likesCount: 2,
      timeAgo: "hace 5 min",
    },
  ]);

  // Estado que guarda la lista de comentarios exclusivos de la publicación de Carlos.
  // Incluye un ejemplo de cómo se estructura una "respuesta" anidada (replies).
  const [comentariosCarlos, setComentariosCarlos] = useState<CommentType[]>([
    {
      id: "2",
      authorName: "María González",
      authorInitials: "MG",
      content: "Si pero, agua de horchata o jamaica?",
      likesCount: 1,
      timeAgo: "hace 1 hora",
      replies: [
        {
          id: "2-1",
          authorName: "Carlos Ramírez",
          authorInitials: "CR",
          content: "Horchata hasta la muerte",
          likesCount: 1,
          timeAgo: "hace 45 min",
        },
      ],
    },
    {
      id: "3",
      authorName: "Ana López",
      authorInitials: "AL",
      content: "¡Qué buena foto!",
      likesCount: 3,
      timeAgo: "hace 30 min",
    }
  ]);

 
  // 2. FUNCIONES DE INTERACCIÓN
  // Estas funciones simulan lo que hará el Backend en el futuro. 
  // Reciben el texto escrito por el usuario en el modal y lo inyectan en la UI.
 

  // Agrega un nuevo comentario al final de la lista del post de Ana
  const agregarComentarioAna = (texto: string) => {
    // 1. Creamos el objeto del nuevo comentario con datos del usuario actual
    const nuevoComentario: CommentType = {
      id: Date.now().toString(), // Genera un ID temporal usando la hora exacta
      authorName: "El guapo", 
      authorInitials: "EG",
      content: texto,
      likesCount: 0,
      timeAgo: "justo ahora",
    };
    // 2. Tomamos el arreglo anterior y le sumamos el nuevo comentario al final
    setComentariosAna([...comentariosAna, nuevoComentario]);
  };

  // Agrega un nuevo comentario al final de la lista del post de Carlos
  const agregarComentarioCarlos = (texto: string) => {
    const nuevoComentario: CommentType = {
      id: Date.now().toString(),
      authorName: "El guapote",
      authorInitials: "EG",
      content: texto,
      likesCount: 0,
      timeAgo: "justo ahora",
    };
    setComentariosCarlos([...comentariosCarlos, nuevoComentario]);
  };

 
  // 3. RENDERIZADO DE LA VISTA (INTERFAZ DE USUARIO)
 
  return (
    // SafeAreaView protege el contenido para que no quede debajo de la muesca del iPhone o la barra de estado
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      
      {/* Componente que muestra el logo de FriendFrame en la parte superior */}
      <FriendframeHeader isDark={isDark} />

      {/* ScrollView permite que el usuario pueda deslizar la pantalla hacia abajo */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false} // Oculta la barrita gris lateral de scroll
        contentContainerStyle={{ paddingBottom: 40 }} // Da un margen inferior para que el último post no se corte
      >
        {/* Contenedor centralizado para limitar el ancho máximo en pantallas grandes (Tablets/Web) */}
        <View className="w-full max-w-2xl mx-auto px-4 mt-4 gap-6">
          

          {/* TARJETA 1: PUBLICACIÓN DE ANA LÓPEZ */}

          <FeedCard
            authorName="Ana López"               // Nombre principal del que publica
            authorInitials="AL"                  // Iniciales para el Avatar circular
            timeAgo="hace 5 horas"               // Etiqueta de tiempo
            targetProfileName="María González"   // Perfil receptor del mensaje (El "-> en el perfil de...")
            textContent="Una de las personas más auténticas que conozco. Gracias por siempre estar ahí! 💙" // Texto principal
            likesCount={79}                      // Número estático de Likes
            isLiked={true}                       // Define si el corazón está coloreado o gris
            
            // PROPS DINÁMICOS PARA COMENTARIOS:
            commentsCount={comentariosAna.length} // Cuenta automáticamente cuántos elementos hay en el estado
            comments={comentariosAna}             // Pasa el arreglo de datos al modal para que los dibuje
            onAddComment={agregarComentarioAna}   // Le inyecta la función para que el botón de "Enviar" sepa qué hacer
          />


          {/* TARJETA 2: PUBLICACIÓN DE CARLOS RAMÍREZ */}

          <FeedCard
            authorName="Carlos Ramírez"
            authorInitials="CR"
            timeAgo="hace 2 horas"
            targetProfileName="María González"
            textContent="Un cafecito con los camaradas"
            
            // Prop exclusivo de esta tarjeta: Renderiza una imagen debajo del texto
            imageSource={require("../../assets/images/EjemploPost.jpg")} 
            
            likesCount={46}
            isLiked={false}
            
            // PROPS DINÁMICOS PARA COMENTARIOS:
            commentsCount={comentariosCarlos.length} 
            comments={comentariosCarlos}
            onAddComment={agregarComentarioCarlos} 
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}