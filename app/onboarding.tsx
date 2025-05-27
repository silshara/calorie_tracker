import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const onboardingData = [
  {
    title: 'Welcome to Calorie Tracker',
    description: 'Your personal AI-powered nutrition assistant for a healthier lifestyle. Track your meals and make informed food choices.',
    image: require('@/assets/images/healthy-food.jpg'),
  },
  {
    title: 'Smart Food Analysis',
    description: 'Simply take a photo of your food and let our AI analyze its nutritional content instantly. Get accurate calorie and nutrient information.',
    image: require('@/assets/images/healthy-food.jpg'),
  },
  {
    title: 'Track Your Progress',
    description: 'Monitor your daily calorie intake, set nutrition goals, and track your progress over time. Stay motivated on your health journey.',
    image: require('@/assets/images/healthy-food.jpg'),
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  const handleSkip = () => {
    // Skip directly to the main app screen
    router.replace('/(tabs)');
  };

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

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <ThemedText style={styles.skipButton}>Skip</ThemedText>
        </TouchableOpacity>
      </View>

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

      <View style={styles.footer}>
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