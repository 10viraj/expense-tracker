import React, { useContext } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { SettingsContext } from '../../context/SettingsContext';

const DUMMY_BUDGETS = [
  { id: '1', category: 'Food', limit: 500, spent: 340, color: Colors.primary },
  { id: '2', category: 'Transport', limit: 150, spent: 145, color: Colors.danger },
  { id: '3', category: 'Entertainment', limit: 200, spent: 50, color: Colors.success },
];

export default function BudgetsScreen() {
  const { currency } = useContext(SettingsContext);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Budgets</Text>
          <Text style={styles.subtitle}>Keep your spending in check</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {DUMMY_BUDGETS.map((budget) => {
            const progress = Math.min((budget.spent / budget.limit) * 100, 100);
            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetCategory}>{budget.category}</Text>
                  <Text style={styles.budgetAmounts}>
                    {currency}{budget.spent} / {currency}{budget.limit}
                  </Text>
                </View>
                
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${progress}%`, backgroundColor: budget.color }
                    ]} 
                  />
                </View>
                <Text style={styles.budgetRemaining}>
                  {currency}{(budget.limit - budget.spent).toFixed(2)} remaining
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.fabContainer}>
          <Button title="Create Budget" onPress={() => {}} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyMuted,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  budgetCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  budgetCategory: {
    ...Typography.h3,
  },
  budgetAmounts: {
    ...Typography.body,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.cardLight,
    borderRadius: Radii.round,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radii.round,
  },
  budgetRemaining: {
    ...Typography.small,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
});
