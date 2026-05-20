import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function AppEntry() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // If not logged in, redirect to first onboarding screen
      router.replace('/(onboarding)/1' as any);
    } else {
      // If logged in, redirect based on role
      if (user.role === 'provider') {
        router.replace('/(tabs)/provider/Dashboard' as any);
      } else {
        router.replace('/(tabs)/customer/home' as any);
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ActivityIndicator size="large" color="#5271FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
