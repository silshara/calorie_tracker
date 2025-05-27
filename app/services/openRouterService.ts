/**
 * OpenRouter Service for food image analysis
 * Integrates with Spoonacular API to analyze food images and extract nutritional information
 * Provides detailed food analysis including calories, macronutrients, and food categories
 */
import * as FileSystem from 'expo-file-system';

// API configuration
const SPOONACULAR_API_KEY = 'c9edbc8d46mshd8a50d41e33c7f0p11cf0ajsn2b7c2bbb0c29';
const API_URL = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/images/analyze';

/**
 * Represents a nutritional value with confidence range
 * Used for calories, protein, fat, and carbs measurements
 */
interface NutritionValue {
  /** The measured value */
  value: number;
  /** Unit of measurement (e.g., 'calories', 'g') */
  unit: string;
  /** Optional confidence range for the measurement */
  confidenceRange?: {
    /** Minimum value in the confidence range */
    min: number;
    /** Maximum value in the confidence range */
    max: number;
  };
}

/**
 * Represents a recipe suggestion from the API
 * Used when the API identifies a specific dish and provides recipe information
 */
interface Recipe {
  /** Unique identifier for the recipe */
  id: number;
  /** Name of the recipe */
  title: string;
  /** URL to the full recipe */
  url: string;
  /** Optional image type information */
  imageType?: string;
}

/**
 * Complete food analysis result from the API
 * Contains all information about the analyzed food image
 */
interface FoodAnalysis {
  /** List of identified food items */
  foodItems: string[];
  /** Total estimated calories */
  estimatedCalories: number;
  /** Overall confidence score (0-100) */
  confidence: number;
  /** Detailed nutrition information */
  nutritionInfo?: {
    /** Calorie information */
    calories: NutritionValue;
    /** Protein content */
    protein: NutritionValue;
    /** Fat content */
    fat: NutritionValue;
    /** Carbohydrate content */
    carbs: NutritionValue;
  };
  /** Food category information */
  category?: {
    /** Category name */
    name: string;
    /** Probability of this category */
    probability: number;
  };
  /** Optional recipe suggestions */
  recipes?: Recipe[];
}

/**
 * Analyzes a food image using the Spoonacular API
 * Processes the image and returns detailed nutritional information
 * 
 * @param imageUri - Local URI of the image to analyze
 * @returns Promise resolving to FoodAnalysis object with nutritional data
 * @throws Error if API request fails or network error occurs
 */
export async function analyzeFoodImage(imageUri: string): Promise<FoodAnalysis> {
  try {
    // Convert local image to base64 for API submission
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('Sending request to Spoonacular API...'); // Debug log

    // Prepare form data with the image for API submission
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'food-image.jpg'
    } as any);

    // Make API request to Spoonacular
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': SPOONACULAR_API_KEY,
        'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
      },
      body: formData
    });

    console.log('Response status:', response.status); // Debug log

    // Handle API errors with detailed error messages
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('API Error Details:', errorData); // Debug log
        errorMessage += `: ${errorData?.message || JSON.stringify(errorData)}`;
      } catch (e) {
        console.error('Failed to parse error response:', e); // Debug log
      }
      throw new Error(errorMessage);
    }

    // Process successful API response
    const data = await response.json();
    console.log('API Response received:', data); // Debug log

    // Extract and format food items from category
    const foodItems = [data.category?.name].filter(Boolean) as string[];
    
    // Format detailed nutrition information with confidence ranges
    const nutritionInfo = data.nutrition ? {
      calories: {
        value: data.nutrition.calories?.value || 0,
        unit: data.nutrition.calories?.unit || 'calories',
        confidenceRange: data.nutrition.calories?.confidenceRange95Percent ? {
          min: data.nutrition.calories.confidenceRange95Percent.min,
          max: data.nutrition.calories.confidenceRange95Percent.max
        } : undefined
      },
      protein: {
        value: data.nutrition.protein?.value || 0,
        unit: data.nutrition.protein?.unit || 'g',
        confidenceRange: data.nutrition.protein?.confidenceRange95Percent ? {
          min: data.nutrition.protein.confidenceRange95Percent.min,
          max: data.nutrition.protein.confidenceRange95Percent.max
        } : undefined
      },
      fat: {
        value: data.nutrition.fat?.value || 0,
        unit: data.nutrition.fat?.unit || 'g',
        confidenceRange: data.nutrition.fat?.confidenceRange95Percent ? {
          min: data.nutrition.fat.confidenceRange95Percent.min,
          max: data.nutrition.fat.confidenceRange95Percent.max
        } : undefined
      },
      carbs: {
        value: data.nutrition.carbs?.value || 0,
        unit: data.nutrition.carbs?.unit || 'g',
        confidenceRange: data.nutrition.carbs?.confidenceRange95Percent ? {
          min: data.nutrition.carbs.confidenceRange95Percent.min,
          max: data.nutrition.carbs.confidenceRange95Percent.max
        } : undefined
      }
    } : undefined;

    // Calculate confidence score from category probability (0-100)
    const confidence = data.category?.probability 
      ? Math.round(data.category.probability * 100)
      : 0;

    // Format recipe suggestions if available
    const recipes = data.recipes?.map((recipe: Recipe) => ({
      id: recipe.id,
      title: recipe.title,
      url: recipe.url
    }));

    // Return formatted analysis result
    return {
      foodItems,
      estimatedCalories: nutritionInfo?.calories.value || 0,
      confidence,
      nutritionInfo,
      category: data.category ? {
        name: data.category.name,
        probability: data.category.probability
      } : undefined,
      recipes
    };
  } catch (error) {
    console.error('Error analyzing food image:', error);
    // Handle network errors with user-friendly message
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    throw error;
  }
} 