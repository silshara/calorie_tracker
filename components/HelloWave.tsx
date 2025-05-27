/**
 * An animated wave emoji component
 * Uses React Native Reanimated to create a smooth waving animation
 * Typically used as a greeting or welcome element
 */
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';

/**
 * HelloWave component that displays an animated waving hand emoji
 * The animation repeats 4 times with a smooth rotation effect
 */
export function HelloWave() {
  // Shared value for the rotation animation
  const rotationAnimation = useSharedValue(0);

  // Set up the animation sequence on mount
  useEffect(() => {
    rotationAnimation.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 150 }), // Rotate to 25 degrees
        withTiming(0, { duration: 150 })   // Return to 0 degrees
      ),
      4 // Run the animation 4 times
    );
  }, [rotationAnimation]);

  // Create animated style for the rotation transform
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationAnimation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <ThemedText style={styles.text}>👋</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
