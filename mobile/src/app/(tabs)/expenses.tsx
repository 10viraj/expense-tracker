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
  Platform,
  Alert,
} from 'react-native';
import Svg, { Rect, Polyline, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { SettingsContext } from '../../context/SettingsContext';
import apiClient from '../../api/client';
import { AddExpenseModal } from '../../components/AddExpenseModal';
import { SearchBar } from '../../components/ui/SearchBar';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const PremiumDark = {
  background: '#09090E',
  surface: '#151520',
  surfaceLight: '#1C1C28',
  textMain: '#F2F2F5',
  textMuted: '#8F8F9D',
  primary: '#00F0FF',
  danger: '#FF3366',
  glassBorder: 'rgba(255, 255, 255, 0.07)',
  success: '#00E676',
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

// --- SPARKLINE ---
function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (!points || points.length < 2) return null;

  const w = SCREEN_WIDTH - 80;
  const h = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);

  const coords = points
    .map((p, i) => {
      const y = h - ((p - min) / range) * (h - 12) - 6;
      return `${i * step},${y}`;
    })
    .join(' ');

  const lastX = (points.length - 1) * step;
  const lastY = h - ((points[points.length - 1] - min) / range) * (h - 12) - 6;

  return (
    <View style={styles.chartContainer}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.15" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Polyline
          points={coords}
          fill="none"
          stroke="url(#sparkGrad)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={lastX} cy={lastY} r={3.5} fill={color} />
        <Circle cx={lastX} cy={lastY} r={10} fill={color} opacity={0.2} />
      </Svg>
    </View>
  );
}

// --- BAR CHART ---
type BarChartProps = {
  data: { label: string; value: number; color: string }[];
  currency: string;
};
function BarChart({ data, currency }: BarChartProps) {
  const CHART_H = 140;
  const BAR_AREA_H = 90;
  const BAR_W = 28;
  const GAP = 18;
  const LABEL_H = 28;
  if (!data.length) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text style={{ color: PremiumDark.textMuted, fontSize: 13 }}>No data for this period</Text>
      </View>
    );
  }
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const totalW = data.length * (BAR_W + GAP);
  const svgW = Math.max(totalW, SCREEN_WIDTH - 56);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={svgW} height={CHART_H + LABEL_H}>
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / maxVal) * BAR_AREA_H);
          const x = i * (BAR_W + GAP) + GAP / 2;
          const y = CHART_H - barH;
          const valLabel = d.value >= 1000
            ? `${currency}${(d.value / 1000).toFixed(1)}k`
            : `${currency}${d.value.toFixed(0)}`;
          return (
            <React.Fragment key={d.label}>
              {/* Bar */}
              <Defs>
                <LinearGradient id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={d.color} stopOpacity="0.95" />
                  <Stop offset="1" stopColor={d.color} stopOpacity="0.35" />
                </LinearGradient>
              </Defs>
              <Rect
                x={x}
                y={y}
                width={BAR_W}
                height={barH}
                rx={6}
                fill={`url(#bg${i})`}
              />
              {/* Amount above bar */}
              <SvgText
                x={x + BAR_W / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={d.color}
              >
                {valLabel}
              </SvgText>
              {/* Category label below */}
              <SvgText
                x={x + BAR_W / 2}
                y={CHART_H + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill={PremiumDark.textMuted}
              >
                {d.label.length > 6 ? d.label.slice(0, 6) + '…' : d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

export default function ExpensesScreen() {
  const { currency } = useContext(SettingsContext);
  const [filterMode, setFilterMode] = useState<'day' | 'month' | 'year'>('month');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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

  // Period-filtered expenses (for report + transactions list)
  const periodFiltered = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (filterMode === 'day') {
        return d.toDateString() === now.toDateString();
      } else if (filterMode === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else {
        return d.getFullYear() === now.getFullYear();
      }
    });
  }, [expenses, filterMode]);

  const periodTotal = useMemo(
    () => periodFiltered.reduce((s, e) => s + e.amount, 0),
    [periodFiltered]
  );

  const barChartData = useMemo(() => {
    const totals: Record<string, { value: number; color: string }> = {};
    periodFiltered.forEach(e => {
      const name = e.category?.name || 'Other';
      if (!totals[name]) totals[name] = { value: 0, color: e.category?.color || PremiumDark.primary };
      totals[name].value += e.amount;
    });
    return Object.entries(totals)
      .map(([label, d]) => ({ label, ...d }))
      .sort((a, b) => b.value - a.value);
  }, [periodFiltered]);


  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const filtered2 = useMemo(() => {
    let result = periodFiltered;
    if (activeCategory) result = result.filter(e => e.category?.name === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e => e.title.toLowerCase().includes(q) || (e.category?.name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery, periodFiltered]);

  const sparkPoints = useMemo(() => {
    const dailyTotals: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyTotals[d.toDateString()] = 0;
    }
    expenses.forEach((e) => {
      const d = new Date(e.date).toDateString();
      if (dailyTotals[d] !== undefined) {
        dailyTotals[d] += e.amount;
      }
    });
    return Object.values(dailyTotals);
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, { total: number; icon: string; color: string }> = {};
    periodFiltered.forEach((e) => {
      const catName = e.category?.name || 'Unknown';
      if (!totals[catName]) {
        totals[catName] = {
          total: 0,
          icon: e.category?.icon || '🏷️',
          color: e.category?.color || PremiumDark.primary,
        };
      }
      totals[catName].total += e.amount;
    });
    return Object.entries(totals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const groupedData = useMemo(() => {
    const sorted = [...filtered2].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const groups: { title: string; data: Expense[] }[] = [];

    sorted.forEach((exp) => {
      const expDate = new Date(exp.date);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let title = expDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      if (expDate.toDateString() === today.toDateString()) title = 'Today';
      else if (expDate.toDateString() === yesterday.toDateString()) title = 'Yesterday';

      const group = groups.find((g) => g.title === title);
      if (group) group.data.push(exp);
      else groups.push({ title, data: [exp] });
    });
    return groups;
  }, [filtered2]);

  const renderItem = ({ item }: { item: Expense }) => {
    const cat = item.category;
    const catName = cat?.name || 'Unknown';
    const color = cat?.color || PremiumDark.primary;
    const icon = cat?.icon || initials(item.title);

    return (
      <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: `${color}18` }]}>
            {cat?.icon ? (
              <Text style={{ fontSize: 20 }}>{icon}</Text>
            ) : (
              <Text style={[styles.transactionIconText, { color }]}>{icon}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.transactionTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.transactionCategory}>{catName}</Text>
          </View>
        </View>
        <Text style={styles.transactionAmount}>
          −{currency}
          {item.amount.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  const FILTER_OPTIONS: { key: 'day' | 'month' | 'year'; label: string }[] = [
    { key: 'day', label: 'Today' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  const filterLabel = filterMode === 'day' ? 'Today' : filterMode === 'month' ? 'This Month' : 'This Year';

  const exportToExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      // --- Build CSV content ---
      const escapeCell = (val: string | number) => {
        const s = String(val);
        // Wrap in quotes if contains comma, quote, or newline
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const headers = ['Date', 'Title', 'Category', `Amount (${currency})`, 'Period'];
      const dataRows = periodFiltered.map(e => [
        new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        e.title,
        e.category?.name || 'Unknown',
        e.amount.toFixed(2),
        filterLabel,
      ]);

      // Total row
      dataRows.push(['', 'TOTAL', '', periodTotal.toFixed(2), '']);

      const csvLines = [
        headers.map(escapeCell).join(','),
        ...dataRows.map(row => row.map(escapeCell).join(',')),
      ];
      const csvContent = csvLines.join('\n');

      // --- Write to file ---
      const fileName = `Expenses_${filterLabel.replace(/ /g, '_')}_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // --- Share ---
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Expenses Report — ${filterLabel}`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support file sharing.');
      }
    } catch (err) {
      console.error('Export failed', err);
      Alert.alert('Export Failed', 'Could not generate the file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderHeader = () => (
    <>
      {/* TOTAL CARD */}
      <View style={styles.topSummaryCard}>
        <View style={styles.summaryGlow} />
        <Text style={styles.summaryLabel}>Total Spent — {filterLabel}</Text>
        <Text style={styles.summaryAmount}>
          {currency}
          {periodTotal.toFixed(2)}
        </Text>
        <Text style={styles.summaryTrendLabel}>Last 7 days trend</Text>
        <Sparkline points={sparkPoints} color={PremiumDark.danger} />
      </View>

      {/* REPORTS SECTION */}
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>Reports</Text>
          <TouchableOpacity
            style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
            onPress={exportToExcel}
            activeOpacity={0.8}
            disabled={isExporting}
          >
            <Ionicons name={isExporting ? 'hourglass-outline' : 'download-outline'} size={14} color="#fff" style={{ marginRight: 5 }} />
            <Text style={styles.exportBtnText}>{isExporting ? 'Exporting…' : 'Export Excel'}</Text>
          </TouchableOpacity>
        </View>

        {/* Segmented Filter */}
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterChip, filterMode === opt.key && styles.filterChipActive]}
              onPress={() => {
                setFilterMode(opt.key);
                setActiveCategory(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, filterMode === opt.key && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bar Chart */}
        <View style={styles.barChartWrap}>
          <BarChart data={barChartData} currency={currency} />
        </View>
      </View>

      {/* CATEGORIES */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.catCardsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catCardsRow}
        >
          {/* ALL card */}
          <TouchableOpacity
            style={[styles.catCard, !activeCategory && styles.catCardActive]}
            onPress={() => setActiveCategory(null)}
            activeOpacity={0.8}
          >
            <View style={[styles.catCardIconWrap, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <Ionicons name="apps" size={18} color={PremiumDark.textMain} />
            </View>
            <Text style={[styles.catCardTitle, !activeCategory && styles.catCardTitleActive]}>
              All
            </Text>
            <Text style={[styles.catCardAmount, !activeCategory && styles.catCardAmountActive]}>
              {currency}
              {total.toFixed(0)}
            </Text>
          </TouchableOpacity>

          {categoryTotals.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.name}
                style={[
                  styles.catCard,
                  isActive && {
                    borderColor: cat.color,
                    backgroundColor: `${cat.color}12`,
                  },
                ]}
                onPress={() => setActiveCategory(isActive ? null : cat.name)}
                activeOpacity={0.8}
              >
                <View style={[styles.catCardIconWrap, { backgroundColor: `${cat.color}22` }]}>
                  <Text style={{ fontSize: 17 }}>{cat.icon}</Text>
                </View>
                <Text
                  style={[styles.catCardTitle, isActive && { color: PremiumDark.textMain }]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
                <Text
                  style={[
                    styles.catCardAmount,
                    isActive && { color: cat.color },
                  ]}
                >
                  {currency}
                  {cat.total.toFixed(0)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <SearchBar
          placeholder="Search expenses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Transactions</Text>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="receipt-outline" size={36} color={PremiumDark.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No expenses yet</Text>
      <Text style={styles.emptyText}>
        {activeCategory
          ? `Nothing recorded in “${activeCategory}” so far.`
          : 'Add your first expense to start tracking.'}
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

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => setIsAddModalVisible(true)}
        >
          <View style={styles.fabGlow} />
          <Ionicons name="add" size={30} color="#09090E" />
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

  // --- TOTAL CARD ---
  topSummaryCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 28,
    backgroundColor: PremiumDark.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  summaryGlow: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: PremiumDark.danger,
    opacity: 0.12,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumDark.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: PremiumDark.textMain,
    letterSpacing: -1.2,
    marginBottom: 18,
  },
  summaryTrendLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PremiumDark.textMuted,
    marginBottom: 10,
  },
  chartContainer: {
    height: 56,
    width: '100%',
  },

  // --- REPORTS ---
  reportCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: PremiumDark.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumDark.textMain,
    letterSpacing: -0.2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A6B3A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  exportBtnDisabled: {
    opacity: 0.55,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: PremiumDark.surfaceLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterChipActive: {
    backgroundColor: PremiumDark.danger,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumDark.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  barChartWrap: {
    minHeight: 80,
  },

  // --- SECTION TITLES ---
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumDark.textMain,
    paddingHorizontal: 20,
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  // --- CATEGORY CARDS ---
  catCardsWrap: {
    marginBottom: 20,
  },
  catCardsRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  catCard: {
    backgroundColor: PremiumDark.surface,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    width: 118,
  },
  catCardActive: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: PremiumDark.surfaceLight,
  },
  catCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  catCardTitle: {
    fontSize: 13,
    color: PremiumDark.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  catCardTitleActive: {
    color: PremiumDark.textMain,
  },
  catCardAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: PremiumDark.textMuted,
  },
  catCardAmountActive: {
    color: PremiumDark.textMain,
  },

  // --- SEARCH ---
  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  // --- LIST ---
  listContainer: {
    paddingBottom: 130,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: PremiumDark.textMuted,
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // --- TRANSACTION ROW ---
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumDark.surface,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  transactionIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconText: {
    fontSize: 17,
    fontWeight: '700',
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumDark.textMain,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: PremiumDark.textMuted,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: PremiumDark.textMain,
    marginLeft: 12,
  },

  // --- EMPTY STATE ---
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PremiumDark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PremiumDark.textMain,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: PremiumDark.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },

  // --- FAB ---
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PremiumDark.danger,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: PremiumDark.danger,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  fabGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 36,
    backgroundColor: PremiumDark.danger,
    opacity: 0.22,
  },
});