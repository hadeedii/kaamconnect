import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

function NavigationWrapper() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!user) {
      // If not logged in and not in auth/onboarding group, redirect to index (onboarding entry)
      if (!inAuthGroup && !inOnboardingGroup && segments.length > 0 && (segments[0] as string) !== 'index') {
        router.replace('/');
      }
    } else {
      // If logged in
      if (inAuthGroup || (segments.length as number) === 0 || (segments[0] as string) === 'index') {
        // Redirect to their respective dashboards based on role
        if (user.role === 'provider') {
          router.replace('/(tabs)/provider/Dashboard' as any);
        } else {
          router.replace('/(tabs)/customer/home' as any);
        }
      }
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Details', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <NavigationWrapper />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
