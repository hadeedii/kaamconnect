import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';
import React from 'react';

export default function BookingLayout() {
  const background = useThemeColor({}, 'background');
  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: true,
      animationTypeForReplace: 'push',
      contentStyle: { backgroundColor: background },
    }} />
  );
}


