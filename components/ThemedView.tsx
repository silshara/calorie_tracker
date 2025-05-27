/**
 * A themed view component that adapts to light/dark mode
 * Provides consistent background colors across the app
 */
import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

/**
 * Props for the ThemedView component
 * Extends React Native's ViewProps with theme support
 */
export type ThemedViewProps = ViewProps & {
  /** Background color to use in light mode */
  lightColor?: string;
  /** Background color to use in dark mode */
  darkColor?: string;
};

/**
 * ThemedView component that automatically adapts its background color to the current theme
 * Wraps React Native's View component with theme support
 */
export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
