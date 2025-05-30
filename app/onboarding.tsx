/**
 * Onboarding Screen Component
 * Displays a series of introductory slides to help users understand the app's features
 * Includes smooth animations, pagination, and navigation controls
 */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Get screen width for slide dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Onboarding slide data
 * Defines the content for each onboarding slide
 */
const onboardingData = [
  {
    title: 'Welcome to Calorie Tracker',
    description: 'Your personal AI-powered nutrition assistant for a healthier lifestyle. Track your meals and make informed food choices.',
    image: require('@/assets/images/healthy-food.jpg'),
  },
  {
    title: 'Smart Food Analysis',
    description: 'Simply take a photo of your food and let our AI analyze its nutritional content instantly. Get accurate calorie and nutrient information.',
    image: require('@/assets/images/healthy-food2.png'),
  },
  {
    title: 'Track Your Progress',
    description: 'Monitor your daily calorie intake, set nutrition goals, and track your progress over time. Stay motivated on your health journey.',
    image: require('@/assets/images/healthy-food3.jpg'),
  },
];

/**
 * OnboardingScreen component
 * Implements a horizontal swipeable onboarding experience with animations
 */
export default function OnboardingScreen() {
  // State for tracking current slide and theme
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  /**
   * Handles navigation to the next slide or main app
   * If on last slide, navigates to main app screen
   */
  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Navigate to the main app screen
      router.replace('/(tabs)');
    }
  };

  /**
   * Skips the onboarding process and navigates to main app
   */
  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  /**
   * Renders a single onboarding slide
   * Includes image, title, and description with fade animations
   */
  const renderItem = ({ item, index }: { item: typeof onboardingData[0]; index: number }) => (
    <Animated.View 
      entering={FadeIn} 
      exiting={FadeOut}
      style={[styles.slide, { width: SCREEN_WIDTH }]}
    >
      <Image
        source={item.image}
        style={styles.image}
        contentFit="cover"
      />
      <ThemedText type="title" style={styles.title}>
        {item.title}
      </ThemedText>
      <ThemedText style={styles.description}>
        {item.description}
      </ThemedText>
    </Animated.View>
  );

  /**
   * Updates current slide index when visible items change
   * Used for pagination dots and navigation
   */
  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // Configuration for determining when a slide is considered visible
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <ThemedView style={styles.container}>
      {/* Skip button in top-right corner */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <ThemedText style={styles.skipButton}>Skip</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Horizontal scrollable slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, index) => index.toString()}
      />

      {/* Bottom navigation and pagination */}
      <View style={styles.footer}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === currentIndex ? colors.tint : colors.tabIconDefault,
                  width: index === currentIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleNext}
        >
          <ThemedText style={styles.buttonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

/**
 * Styles for the Onboarding Screen
 * Includes layout, animations, and theme-specific styling
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  skipButton: {
    fontSize: 16,
    opacity: 0.8,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: SCREEN_WIDTH * 0.8,
    height: 300,
    marginBottom: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 