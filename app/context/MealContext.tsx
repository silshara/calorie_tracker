import React, { createContext, useContext, useEffect, useState } from 'react';
import { sqliteDatabase } from '../services/sqliteDatabaseService';
import { DailyGoals, MonthlySummary } from '../types/database';

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
  dailyGoal: number;                      // User's daily calorie goal
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
  updateDailyGoal: (goal: number) => Promise<void>;  // New function to update daily goal
}

// Create the context with undefined as initial value
const MealContext = createContext<MealContextType | undefined>(undefined);

/**
 * Provider component for the MealContext
 * Manages all meal-related state and operations
 */
export const MealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [dailyGoal, setDailyGoal] = useState(2000); // Default daily goal

  // Initialize database and load data
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Loads all initial data from the database
   * Includes meals, daily goal, and monthly summary
   */
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      const [loadedMeals, goals] = await Promise.all([
        sqliteDatabase.getMealsByDate(today),
        sqliteDatabase.loadDailyGoals()
      ]);

      setMeals(loadedMeals);
      if (goals) {
        setDailyGoal(goals.calories);
      }

      // Load current month's summary
      const summary = await sqliteDatabase.getMonthlySummary(
        today.getMonth(),
        today.getFullYear()
      );
      setMonthlySummary(summary);
      
      setError(null);
    } catch (err) {
      console.error('Error loading meals:', err);
      setError('Failed to load meals from database');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Loads the user's daily calorie goal from the database
   */
  const loadDailyGoal = async () => {
    try {
      const goals = await sqliteDatabase.loadDailyGoals();
      if (goals) {
        setDailyGoal(goals.calories);
      }
    } catch (err) {
      console.error('Error loading daily goal:', err);
      setError('Failed to load daily goal');
    }
  };

  /**
   * Gets the monthly summary for a specific month
   * Updates the current month's summary if applicable
   */
  const getMonthlySummary = async (month: number, year: number) => {
    try {
      const summary = await sqliteDatabase.getMonthlySummary(month, year);
      // Update current month's summary if the requested month is current
      if (month === currentDate.getMonth() && year === currentDate.getFullYear()) {
        setMonthlySummary(summary);
      }
      return summary;
    } catch (err) {
      console.error('Error getting monthly summary:', err);
      setError('Failed to get monthly summary');
      throw err;
    }
  };

  /**
   * Refreshes the current date and reloads meals
   * Used when the app comes back to the foreground
   */
  const refreshCurrentDate = () => {
    setCurrentDate(new Date());
    loadInitialData();
  };

  /**
   * Updates the daily calorie goal in the database
   */
  const updateDailyGoal = async (newGoal: number) => {
    try {
      const goals: DailyGoals = {
        calories: newGoal,
        protein: 0, // Default values for other macros
        carbs: 0,
        fat: 0
      };
      
      await sqliteDatabase.saveDailyGoals(goals);
      setDailyGoal(newGoal);
      setError(null);
    } catch (err) {
      console.error('Error updating daily goal:', err);
      setError('Failed to update daily goal');
      throw err;
    }
  };

  /**
   * Adds a new meal to the database
   * Updates the current day's meals and monthly summary if applicable
   */
  const addMeal = async (meal: Omit<Meal, 'id' | 'timestamp'>) => {
    try {
      const newMeal: Meal = {
        ...meal,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      
      await sqliteDatabase.addMeal(newMeal);
      setMeals(prevMeals => [newMeal, ...prevMeals]);
      
      // Refresh monthly summary if the meal is from current month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const mealMonth = new Date(newMeal.timestamp).getMonth();
      const mealYear = new Date(newMeal.timestamp).getFullYear();
      
      if (mealMonth === currentMonth && mealYear === currentYear) {
        const summary = await sqliteDatabase.getMonthlySummary(currentMonth, currentYear);
        setMonthlySummary(summary);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error adding meal:', err);
      setError('Failed to add meal to database');
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
      await sqliteDatabase.removeMeal(id);
      setMeals(prevMeals => prevMeals.filter(meal => meal.id !== id));
      
      // Refresh monthly summary if the removed meal was from current month
      if (mealToRemove) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const mealMonth = new Date(mealToRemove.timestamp).getMonth();
        const mealYear = new Date(mealToRemove.timestamp).getFullYear();
        
        if (mealMonth === currentMonth && mealYear === currentYear) {
          const summary = await sqliteDatabase.getMonthlySummary(currentMonth, currentYear);
          setMonthlySummary(summary);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error removing meal:', err);
      setError('Failed to remove meal from database');
      throw err;
    }
  };

  /**
   * Gets all meals for a specific date
   */
  const getMealsByDate = async (date: Date) => {
    try {
      return await sqliteDatabase.getMealsByDate(date);
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
    await loadInitialData();
  };

  // Calculate total calories for the current day
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  // Provide the context value to children
  return (
    <MealContext.Provider value={{ 
      meals, 
      totalCalories, 
      dailyGoal,
      addMeal, 
      removeMeal,
      getMealsByDate,
      refreshMeals,
      isLoading,
      error,
      currentDate,
      monthlySummary,
      getMonthlySummary,
      refreshCurrentDate,
      updateDailyGoal
    }}>
      {children}
    </MealContext.Provider>
  );
};

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