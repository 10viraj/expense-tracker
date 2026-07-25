import React, { useContext, useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { SettingsContext } from '../../context/SettingsContext';
import apiClient from '../../api/client';
import { AddExpenseModal } from '../../components/AddExpenseModal';

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

function initials(label: string): string {
  return (label || '?').trim().charAt(0).toUpperCase();
}

type ExpenseCategory = {
  _id: string;
  name: string;
  color: string;
  icon: string;
};

type Expense = {
  _id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- SPARKLINE COMPONENT ---
function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (!points || points.length < 2) return null;
  const w = SCREEN_WIDTH - 96; // padding
  const h = 60;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  
  const coords = points
    .map((p, i) => `${i * step},${h - ((p - min) / range) * (h - 10) - 5}`)
    .join(' ');
    
  const lastX = (points.length - 1) * step;
  const lastY = h - ((points[points.length - 1] - min) / range) * (h - 10) - 5;

  return (
    <View style={styles.chartContainer}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.2" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Polyline
          points={coords}
          fill="none"
          stroke="url(#grad)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={lastX} cy={lastY} r={4} fill={color} />
        <Circle cx={lastX} cy={lastY} r={14} fill={color} opacity={0.25} />
      </Svg>
    </View>
  );
}

export default function ExpensesScreen() {
  const { currency } = useContext(SettingsContext);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

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

  const filtered = useMemo(
    () =>
      activeCategory
        ? expenses.filter((e) => e.category?.name === activeCategory)
        : expenses,
    [activeCategory, expenses]
  );

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const sparkPoints = useMemo(() => {
    // Generate a simple array of last 7 days spending
    const dailyTotals: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyTotals[d.toDateString()] = 0;
    }
    
    expenses.forEach(e => {
      const d = new Date(e.date).toDateString();
      if (dailyTotals[d] !== undefined) {
        dailyTotals[d] += e.amount;
      }
    });
    
    return Object.values(dailyTotals);
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, { total: number; icon: string; color: string }> = {};
    expenses.forEach(e => {
      const catName = e.category?.name || 'Unknown';
      if (!totals[catName]) {
        totals[catName] = { 
          total: 0, 
          icon: e.category?.icon || '🏷️', 
          color: e.category?.color || PremiumDark.primary 
        };
      }
      totals[catName].total += e.amount;
    });
    return Object.entries(totals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

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
            <Text style={styles.transactionDate}>
              {catName}
            </Text>
          </View>
        </View>
        <Text style={styles.transactionAmount}>
          -{currency}{item.amount.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.topSummaryCard}>
        <View style={styles.summaryGlow} />
        <Text style={styles.summaryLabel}>Total Spent (All Time)</Text>
        <Text style={styles.summaryAmount}>{currency}{total.toFixed(2)}</Text>
        <Text style={styles.summaryTrendLabel}>Last 7 Days Trend</Text>
        <Sparkline points={sparkPoints} color={PremiumDark.danger} />
      </View>

      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.catCardsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catCardsRow}
        >
          <TouchableOpacity
            style={[styles.catCard, !activeCategory && styles.catCardActive]}
            onPress={() => setActiveCategory(null)}
          >
            <View style={[styles.catCardIconWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="apps" size={20} color={PremiumDark.textMain} />
            </View>
            <Text style={[styles.catCardTitle, !activeCategory && { color: PremiumDark.textMain }]}>All</Text>
            <Text style={[styles.catCardAmount, !activeCategory && { color: PremiumDark.textMain }]}>
              {currency}{total.toFixed(2)}
            </Text>
          </TouchableOpacity>
          
          {categoryTotals.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.name}
                style={[
                  styles.catCard,
                  isActive && { borderColor: cat.color, backgroundColor: `${cat.color}1A` },
                ]}
                onPress={() => setActiveCategory(isActive ? null : cat.name)}
              >
                <View style={[styles.catCardIconWrap, { backgroundColor: `${cat.color}22` }]}>
                  <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                </View>
                <Text style={[styles.catCardTitle, isActive && { color: PremiumDark.textMain }]}>
                  {cat.name}
                </Text>
                <Text style={[styles.catCardAmount, isActive && { color: cat.color }]}>
                  {currency}{cat.total.toFixed(2)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Transactions</Text>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={48} color={PremiumDark.textMuted} />
      <Text style={styles.emptyTitle}>No expenses found</Text>
      <Text style={styles.emptyText}>
        {activeCategory ? `You haven't spent anything in ${activeCategory} yet.` : "You haven't added any expenses. Track your first one now!"}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <Screen style={{ backgroundColor: PremiumDark.background }}>
        <View style={styles.centerLayout}>
          <ActivityIndicator size="large" color={PremiumDark.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ backgroundColor: PremiumDark.background }}>
      <View style={styles.container}>
        <SectionList
          sections={groupedData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.dateHeader}>{title}</Text>
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PremiumDark.primary}
            />
          }
          stickySectionHeadersEnabled={false}
        />

        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setIsAddModalVisible(true)}>
          <View style={styles.fabGlow} />
          <Ionicons name="add" size={32} color={PremiumDark.background} />
        </TouchableOpacity>

        <AddExpenseModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          onSuccess={fetchExpenses}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerLayout: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSummaryCard: {
    margin: 24,
    marginBottom: 32,
    backgroundColor: PremiumDark.surface,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  summaryGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: PremiumDark.danger,
    opacity: 0.1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumDark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: PremiumDark.textMain,
    letterSpacing: -1,
    marginBottom: 24,
  },
  summaryTrendLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: PremiumDark.textMuted,
    marginBottom: 12,
  },
  chartContainer: {
    height: 60,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PremiumDark.textMain,
    paddingHorizontal: 24,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  catCardsWrap: {
    marginBottom: 24,
  },
  catCardsRow: {
    paddingHorizontal: 24,
    gap: 12,
  },
  catCard: {
    backgroundColor: PremiumDark.surface,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    borderRadius: 20,
    padding: 16,
    width: 130,
    justifyContent: 'center',
  },
  catCardActive: {
    borderColor: PremiumDark.textMuted,
    backgroundColor: PremiumDark.surfaceLight,
  },
  catCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  catCardTitle: {
    fontSize: 14,
    color: PremiumDark.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },
  catCardAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: PremiumDark.textMuted,
  },
  listContainer: {
    paddingBottom: 120,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: PremiumDark.textMuted,
    paddingHorizontal: 24,
    marginTop: 16,
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
    marginHorizontal: 24,
    marginBottom: 10,
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
    fontSize: 16,
    fontWeight: '700',
    color: PremiumDark.textMain,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    fontWeight: '500',
    color: PremiumDark.textMuted,
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: PremiumDark.textMain,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
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
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PremiumDark.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PremiumDark.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 40,
    backgroundColor: PremiumDark.danger,
    opacity: 0.25,
  }
});