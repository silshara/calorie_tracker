import * as SQLite from 'expo-sqlite';
import { Meal } from '../context/MealContext';
import { DailyGoals, DatabaseService, MonthlySummary, UserProfile } from '../types/database';

interface SQLiteRow {
  id: string;
  calories: number;
  timestamp: number;
  image_uri: string | null;
  food_items: string | null;
  confidence: number | null;
}

/**
 * SQLite Database Service Implementation
 * Provides persistent storage using SQLite instead of AsyncStorage
 */
class SQLiteDatabaseService implements DatabaseService {
  private db: SQLite.SQLiteDatabase;
  private isInitialized = false;

  constructor() {
    this.db = SQLite.openDatabaseSync('calorie_tracker.db');
  }

  /**
   * Initializes the database by creating necessary tables if they don't exist
   */
  private async initialize(): Promise<void> {
    if (!this.isInitialized) {
      try {
        await this.createTables();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize database:', error);
        throw new Error('Failed to initialize database');
      }
    }
  }

  /**
   * Creates the necessary database tables if they don't exist
   */
  private async createTables(): Promise<void> {
    const queries = [
      // Meals table
      `CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY,
        calories INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        image_uri TEXT,
        food_items TEXT,
        confidence REAL
      )`,
      // Daily goals table
      `CREATE TABLE IF NOT EXISTS daily_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calories INTEGER NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      // User profile table
      `CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        age INTEGER,
        weight REAL,
        height REAL,
        activity_level TEXT,
        goal TEXT,
        updated_at INTEGER NOT NULL
      )`
    ];

    return new Promise((resolve, reject) => {
      try {
        for (const query of queries) {
          this.db.execSync(query);
        }
        resolve();
      } catch (error) {
        console.error('Error creating tables:', error);
        reject(error);
      }
    });
  }

  // Meal operations
  async saveMeals(meals: Meal[]): Promise<void> {
    await this.initialize();
    try {
      this.db.execSync('DELETE FROM meals');
      for (const meal of meals) {
        const query = `INSERT INTO meals (id, calories, timestamp, image_uri, food_items, confidence) 
                      VALUES ('${meal.id}', ${meal.calories}, ${meal.timestamp}, 
                      '${meal.imageUri.replace(/'/g, "''")}', 
                      '${JSON.stringify(meal.foodItems).replace(/'/g, "''")}', 
                      ${meal.confidence})`;
        this.db.execSync(query);
      }
    } catch (error) {
      console.error('Error saving meals:', error);
      throw new Error('Failed to save meals');
    }
  }

  async loadMeals(): Promise<Meal[]> {
    await this.initialize();
    try {
      const result = this.db.getAllSync<SQLiteRow>('SELECT * FROM meals ORDER BY timestamp DESC');
      return result.map(row => ({
        id: row.id,
        calories: row.calories,
        timestamp: row.timestamp,
        imageUri: row.image_uri || '',
        foodItems: row.food_items ? JSON.parse(row.food_items) : [],
        confidence: row.confidence || 0
      }));
    } catch (error) {
      console.error('Error loading meals:', error);
      throw new Error('Failed to load meals');
    }
  }

  async addMeal(meal: Meal): Promise<void> {
    await this.initialize();
    try {
      const query = `INSERT INTO meals (id, calories, timestamp, image_uri, food_items, confidence) 
                    VALUES ('${meal.id}', ${meal.calories}, ${meal.timestamp}, 
                    '${meal.imageUri.replace(/'/g, "''")}', 
                    '${JSON.stringify(meal.foodItems).replace(/'/g, "''")}', 
                    ${meal.confidence})`;
      this.db.execSync(query);
    } catch (error) {
      console.error('Error adding meal:', error);
      throw new Error('Failed to add meal');
    }
  }

  async removeMeal(id: string): Promise<void> {
    await this.initialize();
    try {
      const query = `DELETE FROM meals WHERE id = '${id.replace(/'/g, "''")}'`;
      this.db.execSync(query);
    } catch (error) {
      console.error('Error removing meal:', error);
      throw new Error('Failed to remove meal');
    }
  }

  async getMealsByDate(date: Date): Promise<Meal[]> {
    await this.initialize();
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    try {
      const query = `SELECT * FROM meals 
                    WHERE timestamp >= ${startDate.getTime()} 
                    AND timestamp <= ${endDate.getTime()} 
                    ORDER BY timestamp DESC`;
      const result = this.db.getAllSync<SQLiteRow>(query);

      return result.map(row => ({
        id: row.id,
        calories: row.calories,
        timestamp: row.timestamp,
        imageUri: row.image_uri || '',
        foodItems: row.food_items ? JSON.parse(row.food_items) : [],
        confidence: row.confidence || 0
      }));
    } catch (error) {
      console.error('Error getting meals by date:', error);
      throw new Error('Failed to get meals by date');
    }
  }

  // Daily goals operations
  async saveDailyGoals(goals: DailyGoals): Promise<void> {
    await this.initialize();
    try {
      const query = `INSERT INTO daily_goals (calories, protein, carbs, fat, updated_at) 
                    VALUES (${goals.calories}, ${goals.protein}, ${goals.carbs}, 
                    ${goals.fat}, ${Date.now()})`;
      this.db.execSync(query);
    } catch (error) {
      console.error('Error saving daily goals:', error);
      throw new Error('Failed to save daily goals');
    }
  }

  async loadDailyGoals(): Promise<DailyGoals | null> {
    await this.initialize();
    try {
      const result = this.db.getAllSync<{
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        updated_at: number;
      }>('SELECT * FROM daily_goals ORDER BY updated_at DESC LIMIT 1');

      if (result.length === 0) {
        return null;
      }

      const latest = result[0];
      return {
        calories: latest.calories,
        protein: latest.protein,
        carbs: latest.carbs,
        fat: latest.fat
      };
    } catch (error) {
      console.error('Error loading daily goals:', error);
      throw new Error('Failed to load daily goals');
    }
  }

  // User profile operations
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await this.initialize();
    try {
      const query = `INSERT INTO user_profile (name, age, weight, height, activity_level, goal, updated_at) 
                    VALUES ('${profile.name.replace(/'/g, "''")}', ${profile.age}, 
                    ${profile.weight}, ${profile.height}, 
                    '${profile.activityLevel}', '${profile.goal}', ${Date.now()})`;
      this.db.execSync(query);
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw new Error('Failed to save user profile');
    }
  }

  async loadUserProfile(): Promise<UserProfile | null> {
    await this.initialize();
    try {
      const result = this.db.getAllSync<{
        name: string;
        age: number;
        weight: number;
        height: number;
        activity_level: string;
        goal: string;
        updated_at: number;
      }>('SELECT * FROM user_profile ORDER BY updated_at DESC LIMIT 1');

      if (result.length === 0) {
        return null;
      }

      const latest = result[0];
      return {
        name: latest.name,
        age: latest.age,
        weight: latest.weight,
        height: latest.height,
        activityLevel: latest.activity_level as UserProfile['activityLevel'],
        goal: latest.goal as UserProfile['goal']
      };
    } catch (error) {
      console.error('Error loading user profile:', error);
      throw new Error('Failed to load user profile');
    }
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    await this.initialize();
    try {
      this.db.execSync('DELETE FROM meals');
      this.db.execSync('DELETE FROM daily_goals');
      this.db.execSync('DELETE FROM user_profile');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }

  // Monthly data operations
  async getMealsByMonth(month: number, year: number): Promise<Meal[]> {
    await this.initialize();
    const startDate = new Date(year, month, 1).getTime();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

    try {
      const query = `SELECT * FROM meals 
                    WHERE timestamp >= ${startDate} 
                    AND timestamp <= ${endDate} 
                    ORDER BY timestamp DESC`;
      const result = this.db.getAllSync<SQLiteRow>(query);

      return result.map(row => ({
        id: row.id,
        calories: row.calories,
        timestamp: row.timestamp,
        imageUri: row.image_uri || '',
        foodItems: row.food_items ? JSON.parse(row.food_items) : [],
        confidence: row.confidence || 0
      }));
    } catch (error) {
      console.error('Error getting meals by month:', error);
      throw new Error('Failed to get meals by month');
    }
  }

  async getMonthlySummary(month: number, year: number): Promise<MonthlySummary> {
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
  }

  async getDailyMeals(date: Date): Promise<Meal[]> {
    return this.getMealsByDate(date);
  }
}

// Export a singleton instance
export const sqliteDatabase = new SQLiteDatabaseService(); 