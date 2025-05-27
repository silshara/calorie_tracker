import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '../../components/ParallaxScrollView';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Meal, useMeals } from '../context/MealContext';
import { analyzeFoodImage } from '../services/openRouterService';

export default function HomeScreen() {
  const { meals, totalCalories, addMeal, removeMeal } = useMeals();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      setError(null);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload food images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await analyzeFood(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image. Please try again.');
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      setError(null);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take food photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await analyzeFood(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      setError('Failed to take photo. Please try again.');
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const analyzeFood = async (imageUri: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const analysis = await analyzeFoodImage(imageUri);
      
      addMeal({
        imageUri,
        foodItems: analysis.foodItems,
        calories: analysis.estimatedCalories,
        confidence: analysis.confidence,
      });

      Alert.alert(
        'Food Analysis Complete',
        `Detected: ${analysis.foodItems.join(', ')}\nEstimated Calories: ${analysis.estimatedCalories}\nConfidence: ${analysis.confidence}%`
      );
    } catch (error) {
      console.error('Error analyzing food:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze food image';
      setError(errorMessage);
      Alert.alert('Error', 'Failed to analyze food image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMeal(mealId);
            } catch (err) {
              console.error('Error deleting meal:', err);
              Alert.alert('Error', 'Failed to delete meal. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#4CAF50', dark: '#1B5E20' }}
      headerImage={
        <Image
          source={require('@/assets/images/healthy-food.jpg')}
          style={styles.headerImage}
          contentFit="cover"
        />
      }>
      {/* Daily Summary Card */}
      <ThemedView style={styles.summaryCard}>
        <ThemedText type="title">Today's Summary</ThemedText>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText type="defaultSemiBold">Calories</ThemedText>
            <ThemedText type="title">{totalCalories} / 2000</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="defaultSemiBold">Meals</ThemedText>
            <ThemedText type="title">{meals.length}</ThemedText>
          </View>
          {/* <View style={styles.statItem}>
            <ThemedText type="defaultSemiBold">Water</ThemedText>
            <ThemedText type="title">0 / 8</ThemedText>
          </View> */}
        </View>
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, isAnalyzing && styles.actionButtonDisabled]}
            onPress={takePhoto}
            disabled={isAnalyzing}>
            <Ionicons name="camera" size={24} color={isAnalyzing ? "#999" : "#4CAF50"} />
            <ThemedText style={isAnalyzing ? styles.actionButtonTextDisabled : undefined}>
              Take Photo
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, isAnalyzing && styles.actionButtonDisabled]}
            onPress={pickImage}
            disabled={isAnalyzing}>
            <Ionicons name="image" size={24} color={isAnalyzing ? "#999" : "#4CAF50"} />
            <ThemedText style={isAnalyzing ? styles.actionButtonTextDisabled : undefined}>
              Upload Image
            </ThemedText>
          </TouchableOpacity>
          {/* <TouchableOpacity 
            style={[styles.actionButton, isAnalyzing && styles.actionButtonDisabled]}
            disabled={isAnalyzing}>
            <Ionicons name="water" size={24} color={isAnalyzing ? "#999" : "#4CAF50"} />
            <ThemedText style={isAnalyzing ? styles.actionButtonTextDisabled : undefined}>
              Log Water
            </ThemedText>
          </TouchableOpacity> */}
        </View>
        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <ThemedText>Analyzing food image...</ThemedText>
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Recent Meals */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Recent Meals</ThemedText>
        {meals.length === 0 ? (
          <ThemedView style={styles.emptyStateContainer}>
            <Ionicons name="restaurant" size={48} color="#666" />
            <ThemedText style={styles.emptyStateText}>
              No meals logged today. Start by taking a photo or uploading an image of your food.
            </ThemedText>
          </ThemedView>
        ) : (
          meals.map((meal: Meal) => (
            <ThemedView key={meal.id} style={styles.mealCard}>
              <Image
                source={{ uri: meal.imageUri }}
                style={styles.mealImage}
                contentFit="cover"
              />
              <View style={styles.mealInfo}>
                <View style={styles.mealHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.mealTitle}>
                    {meal.foodItems.join(', ')}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => handleDeleteMeal(meal.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                <ThemedText>{meal.calories} calories</ThemedText>
                <ThemedText style={styles.confidenceText}>
                  Confidence: {meal.confidence}%
                </ThemedText>
              </View>
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: 200,
    width: '100%',
    position: 'absolute',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  sectionContainer: {
    padding: 16,
    gap: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 100,
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mealImage: {
    width: 100,
    height: 100,
  },
  mealInfo: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  actionButtonTextDisabled: {
    color: '#999',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitle: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
});
