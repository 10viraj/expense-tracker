import React, { useState, useEffect, useContext, useMemo } from 'react';
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
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import apiClient from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { SettingsContext } from '../../context/SettingsContext';

const PremiumDark = {
  background: '#09090E',
  surface: '#151520',
  surfaceLight: '#212130',
  textMain: '#F2F2F5',
  textMuted: '#8F8F9D',
  primary: '#00F0FF',
  accent: '#B047FF',
  danger: '#FF3366',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF3366',
  groceries: '#FF3366',
  transport: '#00D4FF',
  shopping: '#B047FF',
  bills: '#FFB800',
  utilities: '#FFB800',
  entertainment: '#00F0FF',
  health: '#FF3366',
  income: '#00F0FF',
  salary: '#00F0FF',
};

function categoryColor(item: any): string {
  const key = (item.category?.name || item.title || '').toLowerCase();
  for (const k of Object.keys(CATEGORY_COLORS)) {
    if (key.includes(k)) return CATEGORY_COLORS[k];
  }
  return item.type === 'expense' ? PremiumDark.danger : PremiumDark.primary;
}

function initials(label: string): string {
  return (label || '?').trim().charAt(0).toUpperCase();
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still grinding,';
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  if (h < 21) return 'Good evening,';
  return 'Good night,';
}

const SCREEN_WIDTH = Dimensions.get('window').width;

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (!points || points.length < 2) return null;
  const w = SCREEN_WIDTH - 104; // Adjust for padding
  const h = 56;
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
      <Svg width={w} height={h} style={{ opacity: 0.9 }}>
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

type DashboardData = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  balanceHistory?: number[];
  recentTransactions: any[];
};

export default function DashboardScreen() {
  const { user } = useContext(AuthContext);
  const { currency } = useContext(SettingsContext);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const greeting = useMemo(timeOfDayGreeting, []);
  
  // Dummy spark points if not provided by backend
  const sparkPoints = data?.balanceHistory?.length
    ? data.balanceHistory
    : data
      ? [
          data.totalBalance * 0.82,
          data.totalBalance * 0.9,
          data.totalBalance * 0.86,
          data.totalBalance * 0.97,
          data.totalBalance,
        ]
      : [];

  const formatMoney = (n?: number) => {
    if (balanceHidden) return '••••••';
    return `${currency}${(n ?? 0).toFixed(2)}`;
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
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PremiumDark.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{user?.name || 'there'}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials(user?.name || 'U')}
            </Text>
          </View>
        </View>

        {/* Balance Card - Ultimate UI */}
        <View style={styles.balanceCard}>
          <View style={styles.glowEffect} />
          <View style={styles.glowEffect2} />
          
          <View style={styles.balanceTopRow}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity
              onPress={() => setBalanceHidden((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.eyeIconWrap}
            >
              <Ionicons
                name={balanceHidden ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={PremiumDark.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceAmount}>
            {formatMoney(data?.totalBalance)}
          </Text>

          {sparkPoints.length > 1 && !balanceHidden && (
            <View style={styles.sparkWrap}>
              <Sparkline points={sparkPoints} color={PremiumDark.primary} />
            </View>
          )}
        </View>

        {/* Quick Stats - Glassmorphic Panels */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryBoxGlowIncome} />
            <View style={[styles.summaryIconWrap, { backgroundColor: 'rgba(0,240,255,0.15)' }]}>
               <Ionicons name="arrow-down" size={18} color={PremiumDark.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryBoxLabel}>Income</Text>
              <Text style={[styles.summaryBoxAmount, { color: PremiumDark.textMain }]}>
                {formatMoney(data?.totalIncome)}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryBox}>
            <View style={styles.summaryBoxGlowExpense} />
            <View style={[styles.summaryIconWrap, { backgroundColor: 'rgba(255,51,102,0.15)' }]}>
               <Ionicons name="arrow-up" size={18} color={PremiumDark.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryBoxLabel}>Expenses</Text>
              <Text style={[styles.summaryBoxAmount, { color: PremiumDark.textMain }]}>
                {formatMoney(data?.totalExpense)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          data.recentTransactions.map((item, index) => {
            const color = item.category?.color || categoryColor(item);
            const label = item.title || item.category?.name || 'Transaction';
            const icon = item.category?.icon || initials(label);
            
            return (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: `${color}1A` }]}>
                    {item.category?.icon ? (
                      <Text style={{ fontSize: 20 }}>{icon}</Text>
                    ) : (
                      <Text style={[styles.transactionIconText, { color }]}>{icon}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.transactionTitle}>{label}</Text>
                    <Text style={styles.transactionDate}>
                      {item.category?.name || 'Category'} • {new Date(item.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: item.type === 'expense' ? PremiumDark.textMain : PremiumDark.primary },
                  ]}
                >
                  {item.type === 'expense' ? '-' : '+'}
                  {currency}
                  {item.amount.toFixed(2)}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={PremiumDark.textMuted} />
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyText}>
              Your recent activity will appear here once you start tracking.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  greeting: {
    fontSize: 16,
    color: PremiumDark.textMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  name: {
    fontSize: 30,
    fontWeight: '800',
    color: PremiumDark.textMain,
    letterSpacing: -0.5,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PremiumDark.surfaceLight,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PremiumDark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    color: PremiumDark.textMain,
    fontWeight: '800',
    fontSize: 20,
  },
  balanceCard: {
    backgroundColor: PremiumDark.surface,
    borderRadius: 28,
    padding: 28,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  glowEffect: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: PremiumDark.primary,
    opacity: 0.12,
  },
  glowEffect2: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: PremiumDark.accent,
    opacity: 0.08,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  balanceLabel: {
    color: PremiumDark.textMuted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  eyeIconWrap: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
  },
  balanceAmount: {
    color: PremiumDark.textMain,
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginBottom: 12,
    zIndex: 1,
  },
  chartContainer: {
    height: 56,
    width: '100%',
  },
  sparkWrap: {
    marginLeft: -4,
    marginTop: 8,
    zIndex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  summaryBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PremiumDark.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  summaryBoxGlowIncome: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PremiumDark.primary,
    opacity: 0.06,
  },
  summaryBoxGlowExpense: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PremiumDark.danger,
    opacity: 0.06,
  },
  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryBoxLabel: {
    fontSize: 13,
    color: PremiumDark.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
  summaryBoxAmount: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PremiumDark.textMain,
    letterSpacing: -0.4,
  },
  seeAll: {
    color: PremiumDark.primary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
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
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PremiumDark.background,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
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
  },
});