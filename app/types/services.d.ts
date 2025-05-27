declare module '../services/openRouterService' {
  export interface FoodAnalysis {
    foodItems: string[];
    estimatedCalories: number;
    confidence: number;
  }

  export function analyzeFoodImage(imageUri: string): Promise<FoodAnalysis>;
}

declare module '../context/MealContext' {
  import { ReactNode } from 'react';

  export interface Meal {
    id: string;
    timestamp: number;
    imageUri: string;
    foodItems: string[];
    calories: number;
    confidence: number;
  }

  export interface MealContextType {
    meals: Meal[];
    totalCalories: number;
    addMeal: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
    removeMeal: (id: string) => void;
  }

  export function MealProvider({ children }: { children: ReactNode }): JSX.Element;
  export function useMeals(): MealContextType;
} 