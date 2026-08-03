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
  Platform,
  Image,
  useColorScheme,
} from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '../../components/ui/Screen';
import apiClient from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { SettingsContext } from '../../context/SettingsContext';
// import { lightPalette, darkPalette, Palette } from '../../theme/fintechPalette';
import { lightPalette, darkPalette, Palette } from '../../theme/fintechPalette';

const CATEGORY_COLOR_KEYS = [
  'food',
  'groceries',
  'transport',
  'shopping',
  'bills',
  'utilities',
  'entertainment',
  'health',
  'income',
  'salary',
];

// Maps a category keyword to a semantic slot on the palette rather than a
// hardcoded hex, so category colors stay correct in both light and dark mode.
function categorySlot(item: any): 'danger' | 'accent' | 'navy' | 'success' {
  const key = (item.category?.name || item.title || '').toLowerCase();
  if (key.includes('food') || key.includes('groceries') || key.includes('health')) return 'danger';
  if (key.includes('bills') || key.includes('utilities')) return 'navy';
  if (key.includes('income') || key.includes('salary')) return 'success';
  if (key.includes('transport') || key.includes('shopping') || key.includes('entertainment')) return 'accent';
  return item.type === 'expense' ? 'danger' : 'success';
}

function initials(label: string): string {
  return (label || '?').trim().charAt(0).toUpperCase();
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up,';
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  if (h < 21) return 'Good evening,';
  return 'Good night,';
}

const SCREEN_WIDTH = Dimensions.get('window').width;

function Sparkline({ points, color, gradientId }: { points: number[]; color: string; gradientId: string }) {
  if (!points || points.length < 2) return null;

  const w = SCREEN_WIDTH - 112;
  const h = 64;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);

  const coords = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * (h - 16) - 8;
      return `${x},${y}`;
    })
    .join(' ');

  const lastX = (points.length - 1) * step;
  const lastY = h - ((points[points.length - 1] - min) / range) * (h - 16) - 8;

  return (
    <View style={{ height: h, width: '100%' }}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id={`line-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity="0.15" />
            <Stop offset="0.6" stopColor={color} stopOpacity="0.7" />
            <Stop offset="1" stopColor={color} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.18" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Polyline points={`${coords} ${lastX},${h} 0,${h}`} fill={`url(#area-${gradientId})`} stroke="none" />
        <Polyline
          points={coords}
          fill="none"
          stroke={`url(#line-${gradientId})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Circle cx={lastX} cy={lastY} r={5} fill={color} />
        <Circle cx={lastX} cy={lastY} r={12} fill={color} opacity={0.22} />
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
  const isDark = useColorScheme() === 'dark';
  const palette = isDark ? darkPalette : lightPalette;
  const styles = useMemo(() => createStyles(palette), [palette]);

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

  const sparkPoints = data?.balanceHistory?.length
    ? data.balanceHistory
    : data
      ? [
        data.totalBalance * 0.78,
        data.totalBalance * 0.86,
        data.totalBalance * 0.83,
        data.totalBalance * 0.94,
        data.totalBalance * 0.91,
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
        <ActivityIndicator size="large" color={palette.accent} />
      </Screen>
    );
  }

  return (
    <Screen style={{ backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{user?.name || 'there'}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => router.push('/activity')}>
              <Ionicons name="notifications-outline" size={22} color={palette.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={() => router.push('/profile')}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials(user?.name || 'U')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Balance Card ── */}
        <View style={styles.balanceCard}>
          <View style={styles.glowPrimary} />
          <View style={styles.glowAccent} />

          <View style={styles.balanceTopRow}>
            <View>
              <Text style={styles.balanceLabel}>Total Spent</Text>
              <Text style={styles.balanceAmount}>{formatMoney(data?.totalExpense)}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setBalanceHidden((v) => !v)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.eyeButton}
              activeOpacity={0.7}
            >
              <Ionicons name={balanceHidden ? 'eye-off-outline' : 'eye-outline'} size={18} color={palette.textMuted} />
            </TouchableOpacity>
          </View>

          {sparkPoints.length > 1 && !balanceHidden && (
            <View style={styles.sparkWrap}>
              <Sparkline points={sparkPoints} color={palette.accent} gradientId="balance" />
            </View>
          )}
        </View>

        {/* ── Summary row: income vs expense ── */}
        {data && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <View style={[styles.summaryIcon, { backgroundColor: palette.accentDim }]}>
                <Ionicons name="arrow-down-circle" size={20} color={palette.accent} />
              </View>
              <View style={styles.summaryTextCol}>
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={styles.summaryValue}>{formatMoney(data.totalIncome)}</Text>
              </View>
            </View>

            <View style={styles.summaryBox}>
              <View style={[styles.summaryIcon, { backgroundColor: palette.dangerDim }]}>
                <Ionicons name="arrow-up-circle" size={20} color={palette.danger} />
              </View>
              <View style={styles.summaryTextCol}>
                <Text style={styles.summaryLabel}>Expenses</Text>
                <Text style={styles.summaryValue}>{formatMoney(data.totalExpense)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Recent Transactions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <View style={styles.txList}>
            {data.recentTransactions.map((item, index) => {
              const slot = categorySlot(item);
              const color = item.category?.color || palette[slot];
              const label = item.title || item.category?.name || 'Transaction';
              const icon = item.category?.icon || initials(label);
              const isExpense = item.type === 'expense';

              return (
                <TouchableOpacity key={index} style={styles.txItem} activeOpacity={0.75}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIcon, { backgroundColor: `${color}1A` }]}>
                      {item.category?.icon ? (
                        <Text style={{ fontSize: 20 }}>{icon}</Text>
                      ) : (
                        <Text style={[styles.txIconText, { color }]}>{icon}</Text>
                      )}
                    </View>

                    <View style={styles.txMeta}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {label}
                      </Text>
                      <Text style={styles.txSubtitle}>
                        {item.category?.name || 'Category'} ·{' '}
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.txAmount, { color: isExpense ? palette.text : palette.success }]}>
                    {isExpense ? '−' : '+'}
                    {currency}
                    {item.amount.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={36} color={palette.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>Your recent activity will show up here once you start tracking.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    scrollContainer: {
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 48,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 28,
    },
    greeting: {
      fontSize: 14,
      color: palette.textMuted,
      fontWeight: '500',
      marginBottom: 2,
      letterSpacing: 0.2,
    },
    name: {
      fontSize: 28,
      fontWeight: '800',
      color: palette.text,
      letterSpacing: -0.6,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notifDot: {
      position: 'absolute',
      top: 11,
      right: 12,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: palette.danger,
      borderWidth: 1.5,
      borderColor: palette.surface,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 18,
      backgroundColor: palette.navy,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.glassBorder,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 18,
    },

    // Balance Card
    balanceCard: {
      backgroundColor: palette.surface,
      borderRadius: 28,
      padding: 24,
      paddingBottom: 20,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.12,
          shadowRadius: 28,
        },
        android: { elevation: 6 },
      }),
    },
    glowPrimary: {
      position: 'absolute',
      top: -70,
      right: -50,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: palette.accent,
      opacity: 0.08,
    },
    glowAccent: {
      position: 'absolute',
      bottom: -90,
      left: -50,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: palette.navy,
      opacity: 0.06,
    },
    balanceTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
      zIndex: 2,
    },
    balanceLabel: {
      color: palette.textMuted,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    balanceAmount: {
      color: palette.text,
      fontSize: 42,
      fontWeight: '800',
      letterSpacing: -1.4,
    },
    eyeButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: palette.surfaceAlt,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sparkWrap: {
      marginTop: 6,
      marginLeft: -2,
      zIndex: 2,
    },

    // Summary
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
    },
    summaryBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: palette.surface,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: palette.glassBorder,
    },
    summaryIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryTextCol: {
      flex: 1,
    },
    summaryLabel: {
      fontSize: 12,
      color: palette.textMuted,
      fontWeight: '600',
      marginBottom: 3,
    },
    summaryValue: {
      fontSize: 17,
      fontWeight: '800',
      color: palette.text,
      letterSpacing: -0.3,
    },

    // Section
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: palette.text,
      letterSpacing: -0.3,
    },
    seeAll: {
      color: palette.accent,
      fontWeight: '700',
      fontSize: 14,
    },

    // Transactions
    txList: {
      gap: 10,
    },
    txItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: palette.surface,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.glassBorder,
    },
    txLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      flex: 1,
      marginRight: 12,
    },
    txIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    txIconText: {
      fontSize: 17,
      fontWeight: '800',
    },
    txMeta: {
      flex: 1,
    },
    txTitle: {
      fontSize: 15.5,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 3,
    },
    txSubtitle: {
      fontSize: 12.5,
      color: palette.textMuted,
      fontWeight: '500',
    },
    txAmount: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
    },

    // Empty
    emptyState: {
      alignItems: 'center',
      paddingVertical: 56,
      paddingHorizontal: 28,
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 6,
    },
    emptyText: {
      fontSize: 14,
      color: palette.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.bg,
    },
  });
}