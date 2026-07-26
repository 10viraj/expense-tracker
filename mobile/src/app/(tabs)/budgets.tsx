import React, { useContext, useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { SettingsContext } from '../../context/SettingsContext';
import apiClient from '../../api/client';
import { AddBudgetModal } from '../../components/AddBudgetModal';

const PremiumDark = {
  background: '#09090E',
  surface: '#151520',
  surfaceLight: '#212130',
  textMain: '#F2F2F5',
  textMuted: '#8F8F9D',
  primary: '#00F0FF',
  danger: '#FF3366',
  warning: '#FFB800',
  success: '#00E5FF',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

type Category = {
  _id: string;
  name: string;
  color: string;
  icon: string;
};

type Budget = {
  _id: string;
  amount: number;
  month: number;
  year: number;
  category: Category;
};

type Expense = {
  _id: string;
  amount: number;
  date: string;
  category: Category;
};

export default function BudgetsScreen() {
  const { currency } = useContext(SettingsContext);
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      const [budgetsRes, expensesRes] = await Promise.all([
        apiClient.get('/budgets'),
        apiClient.get('/expenses'),
      ]);
      setBudgets(budgetsRes.data || []);
      setExpenses(expensesRes.data?.expenses || []);
    } catch (error) {
      console.error('Failed to fetch budgets data', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const enrichedBudgets = useMemo(() => {
    return budgets.map((budget) => {
      // Calculate how much was spent for this budget's category in the budget's month/year
      const spent = expenses
        .filter((e) => {
          if (!e.category || e.category._id !== budget.category?._id) return false;
          const d = new Date(e.date);
          return d.getMonth() + 1 === budget.month && d.getFullYear() === budget.year;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      return { ...budget, spent };
    });
  }, [budgets, expenses]);

  if (isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={PremiumDark.primary} />
      </Screen>
    );
  }

  return (
    <Screen style={{ backgroundColor: PremiumDark.background }}>
      <View style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <Text style={styles.subtitle}>Track your monthly limits</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PremiumDark.primary} />
        }
      >
        {enrichedBudgets.length > 0 ? (
          enrichedBudgets.map((budget) => {
            const cat = budget.category;
            const progress = Math.min((budget.spent / budget.amount) * 100, 100);
            
            // Color shifts to danger when nearing the limit
            const barColor = progress > 90 ? PremiumDark.danger : 
                             progress > 75 ? PremiumDark.warning : 
                             PremiumDark.primary;

            return (
              <View key={budget._id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.catWrap}>
                    <View style={[styles.iconBox, { backgroundColor: `${cat?.color || PremiumDark.primary}1A` }]}>
                      {cat?.icon ? (
                        <Text style={styles.iconEmoji}>{cat.icon}</Text>
                      ) : (
                        <Text style={[styles.iconText, { color: cat?.color || PremiumDark.primary }]}>
                          {(cat?.name || '?').charAt(0)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.catName}>{cat?.name || 'Unknown'}</Text>
                  </View>

                  <Text style={styles.amountWrap}>
                    <Text style={styles.spentAmount}>{currency}{budget.spent.toFixed(0)}</Text>
                    <Text style={styles.limitAmount}> / {currency}{budget.amount.toFixed(0)}</Text>
                  </Text>
                </View>
                
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${progress}%`, backgroundColor: barColor, shadowColor: barColor }
                    ]} 
                  />
                </View>
                
                <View style={styles.budgetFooter}>
                  <Text style={styles.budgetRemaining}>
                    {budget.amount >= budget.spent 
                      ? `${currency}${(budget.amount - budget.spent).toFixed(2)} left` 
                      : `${currency}${(budget.spent - budget.amount).toFixed(2)} over limit`}
                  </Text>
                  <Text style={styles.budgetPercent}>{progress.toFixed(0)}%</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="pie-chart-outline" size={36} color={PremiumDark.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Budgets Yet</Text>
            <Text style={styles.emptyText}>
              Set up monthly limits for your categories to keep your spending in check.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add" size={32} color={PremiumDark.background} />
      </TouchableOpacity>

      <AddBudgetModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onAdd={fetchData} 
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PremiumDark.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: PremiumDark.textMain,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: PremiumDark.textMuted,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  budgetCard: {
    backgroundColor: PremiumDark.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  catWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '800',
  },
  catName: {
    fontSize: 17,
    fontWeight: '700',
    color: PremiumDark.textMain,
  },
  amountWrap: {
    textAlign: 'right',
  },
  spentAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: PremiumDark.textMain,
  },
  limitAmount: {
    fontSize: 15,
    color: PremiumDark.textMuted,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetRemaining: {
    fontSize: 13,
    color: PremiumDark.textMuted,
    fontWeight: '500',
  },
  budgetPercent: {
    fontSize: 13,
    color: PremiumDark.textMuted,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PremiumDark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PremiumDark.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PremiumDark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumDark.textMain,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: PremiumDark.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
