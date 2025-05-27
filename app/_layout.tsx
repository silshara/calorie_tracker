import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { MealProvider } from './context/MealContext';

import { useColorScheme } from '../hooks/useColorScheme';

const HAS_SEEN_ONBOARDING_KEY = '@calorie_tracker_has_seen_onboarding';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Reset onboarding status for testing (remove this in production)
    // AsyncStorage.removeItem(HAS_SEEN_ONBOARDING_KEY);
    
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY);
      console.log('Onboarding status:', value); // Debug log
      setHasSeenOnboarding(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasSeenOnboarding(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(HAS_SEEN_ONBOARDING_KEY, 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // Show nothing while checking onboarding status
  if (hasSeenOnboarding === null) {
    return null;
  }

  // If onboarding hasn't been seen, redirect to onboarding
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MealProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
            }}
            listeners={{
              beforeRemove: handleOnboardingComplete,
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </MealProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
