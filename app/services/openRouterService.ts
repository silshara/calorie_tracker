import * as FileSystem from 'expo-file-system';

const SPOONACULAR_API_KEY = 'c9edbc8d46mshd8a50d41e33c7f0p11cf0ajsn2b7c2bbb0c29';
const API_URL = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/images/analyze';

interface NutritionValue {
  value: number;
  unit: string;
  confidenceRange?: {
    min: number;
    max: number;
  };
}

interface Recipe {
  id: number;
  title: string;
  url: string;
  imageType?: string;
}

interface FoodAnalysis {
  foodItems: string[];
  estimatedCalories: number;
  confidence: number;
  nutritionInfo?: {
    calories: NutritionValue;
    protein: NutritionValue;
    fat: NutritionValue;
    carbs: NutritionValue;
  };
  category?: {
    name: string;
    probability: number;
  };
  recipes?: Recipe[];
}

export async function analyzeFoodImage(imageUri: string): Promise<FoodAnalysis> {
  try {
    // Convert local image to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('Sending request to Spoonacular API...'); // Debug log

    // Create form data for the image
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'food-image.jpg'
    } as any);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': SPOONACULAR_API_KEY,
        'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
      },
      body: formData
    });

    console.log('Response status:', response.status); // Debug log

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

    const data = await response.json();
    console.log('API Response received:', data); // Debug log

    // Process the Spoonacular response
    const foodItems = [data.category?.name].filter(Boolean) as string[];
    
    // Format nutrition data
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

    // Calculate confidence based on category probability
    const confidence = data.category?.probability 
      ? Math.round(data.category.probability * 100)
      : 0;

    // Format recipes
    const recipes = data.recipes?.map((recipe: Recipe) => ({
      id: recipe.id,
      title: recipe.title,
      url: recipe.url
    }));

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
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    throw error;
  }
} 