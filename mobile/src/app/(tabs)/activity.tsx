import React, { useContext, useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { SettingsContext } from '../../context/SettingsContext';
import apiClient from '../../api/client';
import { SearchBar } from '../../components/ui/SearchBar';

const PremiumDark = {
  background: '#09090E',
  surface: '#151520',
  surfaceLight: '#212130',
  textMain: '#F2F2F5',
  textMuted: '#8F8F9D',
  primary: '#00F0FF',
  danger: '#FF3366',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

type Category = {
  _id: string;
  name: string;
  color: string;
  icon: string;
};

type Expense = {
  _id: string;
  title: string;
  amount: number;
  date: string;
  category: Category;
};

function initials(label: string): string {
  return (label || '?').trim().charAt(0).toUpperCase();
}

export default function ActivityScreen() {
  const { currency } = useContext(SettingsContext);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchExpenses = async () => {
    try {
      const response = await apiClient.get('/expenses');
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const filtered = useMemo(() => {
    let result = expenses;
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(lowerQ) ||
          (e.category?.name || '').toLowerCase().includes(lowerQ)
      );
    }
    return result;
  }, [searchQuery, expenses]);

  const groupedData = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groups: { title: string; data: Expense[] }[] = [];

    sorted.forEach(exp => {
      const expDate = new Date(exp.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let title = expDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      if (expDate.toDateString() === today.toDateString()) {
        title = 'Today';
      } else if (expDate.toDateString() === yesterday.toDateString()) {
        title = 'Yesterday';
      }

      const group = groups.find(g => g.title === title);
      if (group) {
        group.data.push(exp);
      } else {
        groups.push({ title, data: [exp] });
      }
    });
    return groups;
  }, [filtered]);

  const renderItem = ({ item }: { item: Expense }) => {
    const cat = item.category;
    const catName = cat?.name || 'Unknown';
    const color = cat?.color || PremiumDark.primary;
    const icon = cat?.icon || initials(item.title);

    return (
      <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: `${color}1A` }]}>
            {cat?.icon ? (
              <Text style={{ fontSize: 20 }}>{icon}</Text>
            ) : (
              <Text style={[styles.transactionIconText, { color }]}>{icon}</Text>
            )}
          </View>
          <View>
            <Text style={styles.transactionTitle}>{item.title}</Text>
            <Text style={styles.transactionDate}>{catName}</Text>
          </View>
        </View>
        <Text style={styles.transactionAmount}>
          -{currency}{item.amount.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>All your transactions in one place</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          placeholder="Search activity..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      <SectionList
        sections={groupedData}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PremiumDark.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={PremiumDark.textMuted} />
            <Text style={styles.emptyTitle}>No Activity Yet</Text>
            <Text style={styles.emptyText}>
              Your transactions will appear here once you start tracking them.
            </Text>
          </View>
        }
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
    paddingBottom: 16,
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
  searchWrap: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: PremiumDark.textMuted,
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PremiumDark.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconText: {
    fontSize: 18,
    fontWeight: '800',
  },
  transactionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PremiumDark.textMain,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: PremiumDark.textMuted,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: PremiumDark.textMain,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumDark.textMain,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: PremiumDark.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
});
