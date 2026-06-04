import { Stack } from "expo-router";

export default function ExploreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[userId]"
        options={{
          headerShown: false,
          animation: "slide_from_right", // slide in estilo Instagram
          gestureEnabled: true, // swipe back para cerrar
          gestureDirection: "horizontal",
        }}
      />
    </Stack>
  );
}
