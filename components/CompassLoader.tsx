import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface CompassLoaderProps {
  message?: string;
}

export default function CompassLoader({ message = "Orchestrating..." }: CompassLoaderProps) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2200, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1.3, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedRotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
      opacity: 2.3 - pulse.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrapper}>
        {/* Pulsing circular radar wave */}
        <Animated.View style={[styles.pulseCircle, animatedPulseStyle]} />
        
        {/* Solid center dial background */}
        <View style={styles.centerBg}>
          {/* Continuously rotating compass icon */}
          <Animated.View style={[styles.dial, animatedRotationStyle]}>
            <Ionicons name="compass" size={80} color="#000000" />
          </Animated.View>
        </View>
      </View>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loaderWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  pulseCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  centerBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  dial: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
