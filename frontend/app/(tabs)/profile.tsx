import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import UserProfileHeader from '@/components/ui/UserProfileHeader'; 
import '../../global.css';

import { FloatingMenu } from '@/components/ui/FloatingMenu';
import BlockUserWarning from '@/components/ui/BlockUserWarning';
import ProfileTabs from '@/components/ui/ProfileTabs';
import FeedCard from '@/components/ui/FeedCard'; 

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);

  const targetName = isOwnProfile ? "María González" : "Carlos Ramírez";
  const userBio = "ola";

  const mockPosts = [
    { 
      id: '1', hasImage: true, imageSource: require('../../assets/images/EjemploPost.jpg'), 
      textContent: 'Un cafecito con los camaradas', timeAgo: 'hace 2 horas', likes: 45, comments: 12
    },
    { 
      id: '2', hasImage: false, textContent: 'Una de las personas más auténticas que conozco...', 
      timeAgo: 'hace 5 horas', likes: 79, comments: 2
    },
    { 
      id: '3', hasImage: true, imageSource: { uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' }, 
      textContent: 'Puesta de sol increíble 🌅', timeAgo: 'hace 1 día', likes: 120, comments: 5
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-[#182240]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <UserProfileHeader
          name={targetName}
          username={isOwnProfile ? "maria_g" : "carlos_r"}
          profileImageSource={require('../../assets/images/Rick.jpg')} 
          postsCount={isOwnProfile ? 3 : 2}
          friendsCount={2}
          followersCount={3}
        />

        {/* Biografia y acciones */}
        <View className="px-6 pb-4 bg-background-light dark:bg-[#182240]">
          
          <Text className="font-spartan text-sm text-gray-800 dark:text-gray-300 mb-4">
            {userBio}
          </Text>

          {isOwnProfile ? (
            // ESCENARIO 1: Mi perfil/usuario
            <TouchableOpacity className="w-full py-3.5 rounded-2xl bg-gray-200 dark:bg-[#2A3654] items-center">
              <Text className="font-spartan-bold text-black dark:text-white text-base">
                Editar Perfil
              </Text>
            </TouchableOpacity>
          ) : (
            // ESCENARIOS 2 Y 3: Otro usuario
            <View>
              {!isFollowing ? (
                // ESCENARIO 2: No lo sigo :( — solo botón Seguir
                <TouchableOpacity 
                  className="w-full py-3.5 rounded-2xl bg-[#30C2D9] dark:bg-[#AA3E14] items-center"
                  onPress={() => setIsFollowing(true)}
                >
                  <Text className="font-spartan-bold text-white text-base">Seguir</Text>
                </TouchableOpacity>

              ) : (
                // ESCENARIO 3: Si lo sigo :) — botones Siguiendo + Mensaje
                <View className="flex-row justify-between gap-3">
                  <TouchableOpacity 
                    className="flex-1 py-3.5 rounded-2xl bg-gray-200 dark:bg-[#2A3654] items-center"
                    onPress={() => setIsFollowing(false)}
                  >
                    <Text className="font-spartan-bold text-black dark:text-white text-base">Siguiendo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity className="flex-1 py-3.5 rounded-2xl bg-gray-200 dark:bg-[#2A3654] items-center">
                    <Text className="font-spartan-bold text-black dark:text-white text-base">Mensaje</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Bloquear usuario */}
              <View className="mt-3">
                <BlockUserWarning name={isOwnProfile ? 'maria_g' : 'carlos_r'} />
              </View>
            </View>
          )}

        </View>

        {/* TABS */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* POSTS */}
        <View className="flex-1 bg-background-light dark:bg-[#182240] pt-4 min-h-[500px] items-center">
          <View>
            {activeTab === 'grid' && (
              <View className="flex-row flex-wrap gap-2">
                {mockPosts.map((post) => (
                  <TouchableOpacity 
                    key={post.id} 
                    className="w-[32%] aspect-square bg-gray-200 dark:bg-[#2A3654]"
                    onPress={() => console.log('Post:', post.id)}
                  >
                    {post.hasImage ? (
                      <Image 
                        source={typeof post.imageSource === 'string' ? { uri: post.imageSource } : post.imageSource} 
                        style={{ width: '100%', height: '100%' }} 
                        contentFit="cover" 
                      />
                    ) : (
                      <View className="flex-1 p-1 justify-center items-center">
                        <Text className="font-spartan text-[10px] leading-4 text-black dark:text-white text-center" numberOfLines={5}>
                          {post.textContent}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeTab === 'list' && (
              <View className="gap-y-4 px-4">
                {mockPosts.map((post) => (
                  <FeedCard 
                    key={post.id} 
                    authorName={targetName} 
                    authorInitials="CR" 
                    timeAgo={post.timeAgo} 
                    targetProfileName={targetName} 
                    textContent={post.textContent} 
                    imageSource={post.hasImage ? post.imageSource : undefined} 
                    likesCount={post.likes} 
                    commentsCount={post.comments} 
                    isLiked={false} 
                    comments={[]} 
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* FloatingMenu */}
        {!isOwnProfile && (
          <View className="mb-40 pb-10">
            <FloatingMenu 
              onCreatePost={() => console.log('Crear Post')}
              onCreateFragment={() => console.log('Crear Fragment')}
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}