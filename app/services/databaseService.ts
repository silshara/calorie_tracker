import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal } from '../context/MealContext';

// Storage keys
const MEALS_STORAGE_KEY = '@calorie_tracker_meals';
const DAILY_GOALS_KEY = '@calorie_tracker_goals';
const USER_PROFILE_KEY = '@calorie_tracker_profile';

// Types
export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  name: string;
  weight: number;
  height: number;
  age: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
}

export interface MonthlySummary {
  month: number; // 0-11
  year: number;
  totalCalories: number;
  averageCalories: number;
  totalMeals: number;
  dailyAverages: {
    [date: string]: {
      calories: number;
      meals: number;
    }
  };
}

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
  
  // New methods for monthly data
  getMealsByMonth: (month: number, year: number) => Promise<Meal[]>;
  getMonthlySummary: (month: number, year: number) => Promise<MonthlySummary>;
  getDailyMeals: (date: Date) => Promise<Meal[]>;
}

// Helper function to get start and end of day in local timezone
function getLocalDayRange(date: Date): { start: number; end: number } {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);
  const start = localDate.getTime();
  
  const endDate = new Date(localDate);
  endDate.setHours(23, 59, 59, 999);
  const end = endDate.getTime();
  
  return { start, end };
}

// Helper function to get start and end of month in local timezone
function getLocalMonthRange(month: number, year: number): { start: number; end: number } {
  const startDate = new Date(year, month, 1);
  startDate.setHours(0, 0, 0, 0);
  const start = startDate.getTime();
  
  const endDate = new Date(year, month + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  const end = endDate.getTime();
  
  return { start, end };
}

class InMemoryDatabase implements DatabaseService {
  private mealsCache: Meal[] = [];
  private goalsCache: DailyGoals | null = null;
  private profileCache: UserProfile | null = null;
  private isInitialized = false;

  private async initialize() {
    if (!this.isInitialized) {
      try {
        // Load all data in parallel
        const [meals, goals, profile] = await Promise.all([
          this.loadFromStorage<Meal[]>(MEALS_STORAGE_KEY, []),
          this.loadFromStorage<DailyGoals | null>(DAILY_GOALS_KEY, null),
          this.loadFromStorage<UserProfile | null>(USER_PROFILE_KEY, null),
        ]);

        this.mealsCache = meals;
        this.goalsCache = goals;
        this.profileCache = profile;
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Initialize with empty data
        this.mealsCache = [];
        this.goalsCache = null;
        this.profileCache = null;
        this.isInitialized = true;
      }
    }
  }

  private async loadFromStorage<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error loading data from ${key}:`, error);
      return defaultValue;
    }
  }

  private async saveToStorage<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data to ${key}:`, error);
      throw new Error(`Failed to save data to ${key}`);
    }
  }

  // Meal operations
  async saveMeals(meals: Meal[]): Promise<void> {
    try {
      await this.initialize();
      await this.saveToStorage(MEALS_STORAGE_KEY, meals);
      this.mealsCache = meals;
    } catch (error) {
      console.error('Error saving meals:', error);
      throw new Error('Failed to save meals');
    }
  }

  async loadMeals(): Promise<Meal[]> {
    try {
      await this.initialize();
      return [...this.mealsCache];
    } catch (error) {
      console.error('Error loading meals:', error);
      throw new Error('Failed to load meals');
    }
  }

  async addMeal(meal: Meal): Promise<void> {
    try {
      await this.initialize();
      const updatedMeals = [...this.mealsCache, meal];
      await this.saveMeals(updatedMeals);
    } catch (error) {
      console.error('Error adding meal:', error);
      throw new Error('Failed to add meal');
    }
  }

  async removeMeal(id: string): Promise<void> {
    try {
      await this.initialize();
      const updatedMeals = this.mealsCache.filter(meal => meal.id !== id);
      await this.saveMeals(updatedMeals);
    } catch (error) {
      console.error('Error removing meal:', error);
      throw new Error('Failed to remove meal');
    }
  }

  async getMealsByDate(date: Date): Promise<Meal[]> {
    try {
      await this.initialize();
      const { start, end } = getLocalDayRange(date);
      
      return this.mealsCache.filter(meal => 
        meal.timestamp >= start && meal.timestamp <= end
      );
    } catch (error) {
      console.error('Error getting meals by date:', error);
      throw new Error('Failed to get meals by date');
    }
  }

  // Goals operations
  async saveDailyGoals(goals: DailyGoals): Promise<void> {
    try {
      await this.initialize();
      await this.saveToStorage(DAILY_GOALS_KEY, goals);
      this.goalsCache = goals;
    } catch (error) {
      console.error('Error saving daily goals:', error);
      throw new Error('Failed to save daily goals');
    }
  }

  async loadDailyGoals(): Promise<DailyGoals | null> {
    try {
      await this.initialize();
      return this.goalsCache;
    } catch (error) {
      console.error('Error loading daily goals:', error);
      throw new Error('Failed to load daily goals');
    }
  }

  // Profile operations
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await this.initialize();
      await this.saveToStorage(USER_PROFILE_KEY, profile);
      this.profileCache = profile;
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw new Error('Failed to save user profile');
    }
  }

  async loadUserProfile(): Promise<UserProfile | null> {
    try {
      await this.initialize();
      return this.profileCache;
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw new Error('Failed to load user profile');
    }
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(MEALS_STORAGE_KEY),
        AsyncStorage.removeItem(DAILY_GOALS_KEY),
        AsyncStorage.removeItem(USER_PROFILE_KEY),
      ]);
      
      this.mealsCache = [];
      this.goalsCache = null;
      this.profileCache = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  // New methods for monthly data
  async getMealsByMonth(month: number, year: number): Promise<Meal[]> {
    try {
      await this.initialize();
      const { start, end } = getLocalMonthRange(month, year);
      
      return this.mealsCache.filter(meal => 
        meal.timestamp >= start && meal.timestamp <= end
      );
    } catch (error) {
      console.error('Error getting meals by month:', error);
      throw new Error('Failed to get meals by month');
    }
  }

  async getMonthlySummary(month: number, year: number): Promise<MonthlySummary> {
    try {
      const meals = await this.getMealsByMonth(month, year);
      const dailyAverages: { [date: string]: { calories: number; meals: number } } = {};
      
      // Calculate daily averages using local dates
      meals.forEach(meal => {
        const localDate = new Date(meal.timestamp);
        const dateKey = localDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        
        if (!dailyAverages[dateKey]) {
          dailyAverages[dateKey] = { calories: 0, meals: 0 };
        }
        dailyAverages[dateKey].calories += meal.calories;
        dailyAverages[dateKey].meals += 1;
      });

      const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
      const totalMeals = meals.length;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const averageCalories = totalMeals > 0 ? totalCalories / daysInMonth : 0;

      return {
        month,
        year,
        totalCalories,
        averageCalories,
        totalMeals,
        dailyAverages
      };
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      throw new Error('Failed to get monthly summary');
    }
  }

  async getDailyMeals(date: Date): Promise<Meal[]> {
    try {
      await this.initialize();
      const { start, end } = getLocalDayRange(date);
      
      return this.mealsCache.filter(meal => 
        meal.timestamp >= start && meal.timestamp <= end
      );
    } catch (error) {
      console.error('Error getting daily meals:', error);
      throw new Error('Failed to get daily meals');
    }
  }
}

// Export a singleton instance
export const databaseService = new InMemoryDatabase(); 