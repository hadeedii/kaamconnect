import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function IndexRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/(auth)/role' as any);
    } else if (user.role === 'provider') {
      router.replace('/(tabs)/provider/Dashboard' as any);
    } else {
      router.replace('/(tabs)/customer/home' as any);
    }
  }, [user, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#5271FF" />
    </View>
  );
}
