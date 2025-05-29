import { Meal } from '../context/MealContext';

/**
 * Interface defining the daily nutrition goals for the user
 */
export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Interface defining the user's profile information
 */
export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
}

/**
 * Interface defining the monthly summary data
 */
export interface MonthlySummary {
  month: number;
  year: number;
  totalCalories: number;
  averageCalories: number;
  totalMeals: number;
  dailyAverages: {
    [date: string]: {
      calories: number;
      meals: number;
    };
  };
}

/**
 * Interface defining all database operations
 * Provides type safety for database interactions
 */
export interface DatabaseService {
  // Meal operations
  saveMeals: (meals: Meal[]) => Promise<void>;
  loadMeals: () => Promise<Meal[]>;
  addMeal: (meal: Meal) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  getMealsByDate: (date: Date) => Promise<Meal[]>;
  
  // Goals operations
  saveDailyGoals: (goals: DailyGoals) => Promise<void>;
  loadDailyGoals: () => Promise<DailyGoals | null>;
  
  // Profile operations
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  loadUserProfile: () => Promise<UserProfile | null>;
  
  // Utility operations
  clearAllData: () => Promise<void>;
  
  // Monthly data operations
  getMealsByMonth: (month: number, year: number) => Promise<Meal[]>;
  getMonthlySummary: (month: number, year: number) => Promise<MonthlySummary>;
  getDailyMeals: (date: Date) => Promise<Meal[]>;
} 