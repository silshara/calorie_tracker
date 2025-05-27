import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useMeals } from '../context/MealContext';
import { MonthlySummary } from '../services/databaseService';

/**
 * Monthly Report Screen Component
 * Displays a summary of nutrition data for a selected month
 * Includes total calories, daily averages, and a breakdown of meals
 */
export default function MonthlyReportScreen() {
  // Get required functions and data from the meal context
  const { getMonthlySummary, monthlySummary: currentMonthSummary } = useMeals();
  
  // State management
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Theme management
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Load monthly data when the screen comes into focus or month changes
  useFocusEffect(
    useCallback(() => {
      loadMonthlyData();
    }, [selectedMonth])
  );

  /**
   * Loads the monthly summary data for the selected month
   * Updates the loading state and handles any errors
   */
  const loadMonthlyData = async () => {
    try {
      setIsLoading(true);
      const data = await getMonthlySummary(
        selectedMonth.getMonth(),
        selectedMonth.getFullYear()
      );
      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Changes the selected month by the specified number of months
   * @param months - Number of months to add (positive) or subtract (negative)
   */
  const changeMonth = (months: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + months);
    setSelectedMonth(newDate);
  };

  /**
   * Formats the month and year for display
   * Uses the Finland timezone for consistent date handling
   */
  const formatMonthYear = (date: Date) => {
    return date.toLocaleString('default', { 
      month: 'long', 
      year: 'numeric',
      timeZone: 'Europe/Helsinki' // Use Finland timezone
    });
  };

  /**
   * Renders the daily breakdown section
   * Shows calories and meal count for each day in the month
   */
  const renderDailyBreakdown = () => {
    if (!monthlyData) return null;

    return Object.entries(monthlyData.dailyAverages)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([dateKey, data]) => {
        // Parse the date key (YYYY-MM-DD) and create a local date
        const [year, month, day] = dateKey.split('-').map(Number);
        const localDate = new Date(year, month - 1, day); // month is 0-based in JavaScript

        return (
          <View key={dateKey} style={styles.dailyItem}>
            <ThemedText style={styles.dateText}>
              {localDate.toLocaleDateString('default', { 
                month: 'short', 
                day: 'numeric',
                timeZone: 'Europe/Helsinki' // Use Finland timezone
              })}
            </ThemedText>
            <View style={styles.dailyStats}>
              <ThemedText style={styles.calorieText}>
                {Math.round(data.calories)} cal
              </ThemedText>
              <ThemedText style={styles.mealCountText}>
                {data.meals} meals
              </ThemedText>
            </View>
          </View>
        );
      });
  };

  return (
    <ThemedView style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => changeMonth(-1)}
          style={styles.monthButton}
        >
          <ThemedText style={styles.monthButtonText}>←</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.monthTitle}>
          {formatMonthYear(selectedMonth)}
        </ThemedText>
        
        <TouchableOpacity 
          onPress={() => changeMonth(1)}
          style={styles.monthButton}
        >
          <ThemedText style={styles.monthButtonText}>→</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {isLoading ? (
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        ) : monthlyData ? (
          <>
            {/* Monthly Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryCard, { backgroundColor: colors.tint + '20' }]}>
                <ThemedText style={styles.summaryTitle}>Total Calories</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {Math.round(monthlyData.totalCalories)}
                </ThemedText>
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: colors.tint + '20' }]}>
                <ThemedText style={styles.summaryTitle}>Daily Average</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {Math.round(monthlyData.averageCalories)}
                </ThemedText>
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: colors.tint + '20' }]}>
                <ThemedText style={styles.summaryTitle}>Total Meals</ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {monthlyData.totalMeals}
                </ThemedText>
              </View>
            </View>

            {/* Daily Breakdown Section */}
            <View style={styles.dailyBreakdown}>
              <ThemedText style={styles.sectionTitle}>Daily Breakdown</ThemedText>
              {renderDailyBreakdown()}
            </View>
          </>
        ) : (
          <ThemedText style={styles.noDataText}>No data available for this month</ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

/**
 * Styles for the Monthly Report Screen
 * Includes layout, colors, and typography
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16, // Add spacing from the top
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  monthButton: {
    padding: 10,
  },
  monthButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dailyBreakdown: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  dailyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateText: {
    fontSize: 16,
  },
  dailyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 15,
  },
  mealCountText: {
    fontSize: 14,
    opacity: 0.8,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    opacity: 0.8,
  },
}); 