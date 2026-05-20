import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function CustomToggle({ value, onValueChange }: CustomToggleProps) {
  // Translate thumb position dynamically (0 = OFF, 1 = ON)
  const position = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    position.value = withTiming(value ? 1 : 0, { duration: 250 });
  }, [value]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      position.value,
      [0, 1],
      ['#DDE3EC', '#A855F7'] // Matches the light grey/blue and premium purple states
    );
    return {
      backgroundColor,
    };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: position.value * 50, // Slides from left (4) to right (54)
        },
      ],
    };
  });

  const animatedTextOnStyle = useAnimatedStyle(() => {
    return {
      opacity: position.value,
    };
  });

  const animatedTextOffStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - position.value,
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onValueChange(!value)}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        {/* "ON" label displayed on the left when ON */}
        <Animated.Text style={[styles.textOn, animatedTextOnStyle]}>
          ON
        </Animated.Text>

        {/* "OFF" label displayed on the right when OFF */}
        <Animated.Text style={[styles.textOff, animatedTextOffStyle]}>
          OFF
        </Animated.Text>

        {/* Animated slider thumb */}
        <Animated.View style={[styles.thumb, animatedThumbStyle]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
  },
  container: {
    width: 90,
    height: 40,
    borderRadius: 20,
    padding: 4,
    justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 4,
    top: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  textOn: {
    position: 'absolute',
    left: 14,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  textOff: {
    position: 'absolute',
    right: 14,
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
