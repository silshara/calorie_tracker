import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { databaseService, MonthlySummary } from '../services/databaseService';

export interface Meal {
  id: string;
  timestamp: number;
  imageUri: string;
  foodItems: string[];
  calories: number;
  confidence: number;
}

interface MealContextType {
  meals: Meal[];
  totalCalories: number;
  isLoading: boolean;
  error: string | null;
  currentDate: Date;
  monthlySummary: MonthlySummary | null;
  addMeal: (meal: Omit<Meal, 'id' | 'timestamp'>) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  getMealsByDate: (date: Date) => Promise<Meal[]>;
  refreshMeals: () => Promise<void>;
  getMonthlySummary: (month: number, year: number) => Promise<MonthlySummary>;
  refreshCurrentDate: () => void;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export function MealProvider({ children }: { children: ReactNode }) {
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

  const checkDateChange = () => {
    const now = new Date();
    if (now.getDate() !== currentDate.getDate() ||
        now.getMonth() !== currentDate.getMonth() ||
        now.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(now);
      loadMeals();
    }
  };

  const loadMeals = async () => {
    try {
      setIsLoading(true);
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

  const getMonthlySummary = async (month: number, year: number) => {
    try {
      const summary = await databaseService.getMonthlySummary(month, year);
      if (month === currentDate.getMonth() && year === currentDate.getFullYear()) {
        setMonthlySummary(summary);
      }
      return summary;
    } catch (err) {
      console.error('Error getting monthly summary:', err);
      throw new Error('Failed to get monthly summary');
    }
  };

  const refreshCurrentDate = () => {
    setCurrentDate(new Date());
    loadMeals();
  };

  const addMeal = async (meal: Omit<Meal, 'id' | 'timestamp'>) => {
    try {
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

  const getMealsByDate = async (date: Date) => {
    try {
      return await databaseService.getMealsByDate(date);
    } catch (err) {
      console.error('Error getting meals by date:', err);
      setError('Failed to get meals by date');
      throw err;
    }
  };

  const refreshMeals = async () => {
    await loadMeals();
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

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

export function useMeals() {
  const context = useContext(MealContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealProvider');
  }
  return context;
} 