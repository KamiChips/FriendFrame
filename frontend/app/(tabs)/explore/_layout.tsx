import { Stack } from "expo-router";

export default function ExploreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[userId]"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </Stack>
  );
}
