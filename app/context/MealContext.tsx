import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { databaseService, MonthlySummary } from '../services/databaseService';

/**
 * Represents a single meal entry in the app
 * Contains all information about a logged meal
 */
export interface Meal {
  id: string;              // Unique identifier for the meal
  timestamp: number;       // Unix timestamp when the meal was logged
  imageUri: string;        // URI of the meal's image
  foodItems: string[];     // List of detected food items
  calories: number;        // Estimated calories for the meal
  confidence: number;      // Confidence score of the food detection (0-100)
}

/**
 * Defines the shape of the MealContext
 * Provides all meal-related operations and state to the app
 */
interface MealContextType {
  meals: Meal[];                          // Current day's meals
  totalCalories: number;                  // Total calories for the current day
  isLoading: boolean;                     // Loading state for async operations
  error: string | null;                   // Error state for failed operations
  currentDate: Date;                      // Current date being viewed
  monthlySummary: MonthlySummary | null;  // Current month's summary
  addMeal: (meal: Omit<Meal, 'id' | 'timestamp'>) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  getMealsByDate: (date: Date) => Promise<Meal[]>;
  refreshMeals: () => Promise<void>;
  getMonthlySummary: (month: number, year: number) => Promise<MonthlySummary>;
  refreshCurrentDate: () => void;
}

// Create the context with undefined as initial value
const MealContext = createContext<MealContextType | undefined>(undefined);

/**
 * Provider component for the MealContext
 * Manages all meal-related state and operations
 */
export function MealProvider({ children }: { children: ReactNode }) {
  // State management
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);

  // Load meals and check date on mount
  useEffect(() => {
    loadMeals();
    checkDateChange();
  }, []);

  // Check for date change every minute
  useEffect(() => {
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Checks if the current date has changed
   * If it has, updates the current date and reloads meals
   */
  const checkDateChange = () => {
    const now = new Date();
    if (now.getDate() !== currentDate.getDate() ||
        now.getMonth() !== currentDate.getMonth() ||
        now.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(now);
      loadMeals();
    }
  };

  /**
   * Loads meals for the current date and updates the monthly summary
   */
  const loadMeals = async () => {
    try {
      setIsLoading(true);
      // Get meals for the current date
      const todayMeals = await databaseService.getDailyMeals(currentDate);
      setMeals(todayMeals);
      
      // Load current month's summary
      const summary = await databaseService.getMonthlySummary(
        currentDate.getMonth(),
        currentDate.getFullYear()
      );
      setMonthlySummary(summary);
      
      setError(null);
    } catch (err) {
      console.error('Error loading meals:', err);
      setError('Failed to load meals from storage');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gets the monthly summary for a specific month
   * Updates the current month's summary if applicable
   */
  const getMonthlySummary = async (month: number, year: number) => {
    try {
      const summary = await databaseService.getMonthlySummary(month, year);
      // Update current month's summary if the requested month is current
      if (month === currentDate.getMonth() && year === currentDate.getFullYear()) {
        setMonthlySummary(summary);
      }
      return summary;
    } catch (err) {
      console.error('Error getting monthly summary:', err);
      throw new Error('Failed to get monthly summary');
    }
  };

  /**
   * Refreshes the current date and reloads meals
   * Used when the app comes back to the foreground
   */
  const refreshCurrentDate = () => {
    setCurrentDate(new Date());
    loadMeals();
  };

  /**
   * Adds a new meal to the database
   * Updates the current day's meals and monthly summary if applicable
   */
  const addMeal = async (meal: Omit<Meal, 'id' | 'timestamp'>) => {
    try {
      // Create a new meal with generated ID and current timestamp
      const newMeal: Meal = {
        ...meal,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      
      await databaseService.addMeal(newMeal);
      setMeals(prevMeals => [...prevMeals, newMeal]);
      
      // Refresh monthly summary if the meal is from current month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const mealMonth = new Date(newMeal.timestamp).getMonth();
      const mealYear = new Date(newMeal.timestamp).getFullYear();
      
      if (mealMonth === currentMonth && mealYear === currentYear) {
        const summary = await databaseService.getMonthlySummary(currentMonth, currentYear);
        setMonthlySummary(summary);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error adding meal:', err);
      setError('Failed to add meal to storage');
      throw err;
    }
  };

  /**
   * Removes a meal from the database
   * Updates the current day's meals and monthly summary if applicable
   */
  const removeMeal = async (id: string) => {
    try {
      const mealToRemove = meals.find(meal => meal.id === id);
      await databaseService.removeMeal(id);
      setMeals(prevMeals => prevMeals.filter(meal => meal.id !== id));
      
      // Refresh monthly summary if the removed meal was from current month
      if (mealToRemove) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const mealMonth = new Date(mealToRemove.timestamp).getMonth();
        const mealYear = new Date(mealToRemove.timestamp).getFullYear();
        
        if (mealMonth === currentMonth && mealYear === currentYear) {
          const summary = await databaseService.getMonthlySummary(currentMonth, currentYear);
          setMonthlySummary(summary);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error removing meal:', err);
      setError('Failed to remove meal from storage');
      throw err;
    }
  };

  /**
   * Gets all meals for a specific date
   */
  const getMealsByDate = async (date: Date) => {
    try {
      return await databaseService.getMealsByDate(date);
    } catch (err) {
      console.error('Error getting meals by date:', err);
      setError('Failed to get meals by date');
      throw err;
    }
  };

  /**
   * Refreshes the current day's meals
   */
  const refreshMeals = async () => {
    await loadMeals();
  };

  // Calculate total calories for the current day
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  // Provide the context value to children
  return (
    <MealContext.Provider value={{ 
      meals, 
      totalCalories, 
      addMeal, 
      removeMeal,
      getMealsByDate,
      refreshMeals,
      isLoading,
      error,
      currentDate,
      monthlySummary,
      getMonthlySummary,
      refreshCurrentDate
    }}>
      {children}
    </MealContext.Provider>
  );
}

/**
 * Custom hook to use the MealContext
 * Throws an error if used outside of a MealProvider
 */
export function useMeals() {
  const context = useContext(MealContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealProvider');
  }
  return context;
} 