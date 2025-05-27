/**
 * A tab button component that provides haptic feedback on iOS
 * Enhances the user experience with tactile feedback when pressing tabs
 */
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

/**
 * HapticTab component that wraps the bottom tab button
 * Provides light haptic feedback on iOS when the tab is pressed
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Trigger light haptic feedback on iOS devices
          // This provides subtle tactile feedback for better UX
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
