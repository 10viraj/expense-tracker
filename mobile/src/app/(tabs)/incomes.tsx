import React, { useContext } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { SettingsContext } from '../../context/SettingsContext';

const DUMMY_INCOMES = [
  { id: '1', title: 'Salary', amount: 5000.00, category: 'Work', date: '1st of Month' },
  { id: '2', title: 'Freelance Project', amount: 1200.00, category: 'Side Hustle', date: '5 days ago' },
  { id: '3', title: 'Sold old laptop', amount: 300.00, category: 'Misc', date: '2 weeks ago' },
];

export default function IncomesScreen() {
  const { currency } = useContext(SettingsContext);

  const renderItem = ({ item }: { item: typeof DUMMY_INCOMES[0] }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIcon} />
        <View>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionDate}>{item.category} • {item.date}</Text>
        </View>
      </View>
      <Text style={styles.transactionAmount}>+{currency}{item.amount.toFixed(2)}</Text>
    </View>
  );

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Incomes</Text>
          <Text style={styles.subtitle}>Track your earnings</Text>
        </View>

        <FlatList
          data={DUMMY_INCOMES}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.fabContainer}>
          <Button title="Add Income" onPress={() => {}} />
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
  listContainer: {
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    marginBottom: Spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.cardLight,
    marginRight: Spacing.md,
  },
  transactionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  transactionDate: {
    ...Typography.small,
  },
  transactionAmount: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.success,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
});
