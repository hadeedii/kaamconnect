import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="customer/nearby" />
      <Stack.Screen name="customer/processing" />
      <Stack.Screen name="customer/agent_logs" />
      <Stack.Screen name="customer/confirmation" />
      <Stack.Screen name="customer/all_providers" />
      <Stack.Screen name="customer/provider_details" />
      <Stack.Screen name="customer/chat" />
      <Stack.Screen name="provider/chat" />
    </Stack>
  );
}
