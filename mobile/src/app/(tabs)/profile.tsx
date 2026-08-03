import React, { useContext, useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Alert,
  useColorScheme,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics'; // Added for premium tactile feedback
import { Screen } from '../../components/ui/Screen';
import { EditProfileModal } from '../../components/EditProfileModal';
import { AuthContext } from '../../context/AuthContext';
import { SettingsContext } from '../../context/SettingsContext';
import { lightPalette, darkPalette, Palette } from '../../theme/fintechPalette';
import apiClient from '../../api/client';

const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
];

const BANK_TYPES = ['Savings', 'Current', 'Salary', 'NRE', 'Credit Card', 'Wallet'];

type BankAccount = {
  id: string;
  name: string;       // e.g. "SBI", "HDFC"
  type: string;       // e.g. "Savings"
  last4: string;      // last 4 digits
};
const APP_VERSION = '1.0.0';

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  slot: 'accent' | 'navy' | 'success' | 'danger';
  route?: string;
};

function initials(name?: string): string {
  return (name || 'U').trim().charAt(0).toUpperCase();
}

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const palette = isDark ? darkPalette : lightPalette;
  const styles = useMemo(() => createStyles(palette), [palette]);

  const { user, logout, isBiometricEnabled, setBiometricEnabled } = useContext(AuthContext);
  const { currency, setCurrency } = useContext(SettingsContext);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<number[]>([]);
  const [profileStats, setProfileStats] = useState<{ monthlySpend: number; activeBudgets: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // --- Bank accounts ---
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ name: '', type: 'Savings', last4: '' });
  const [bankTypeOpen, setBankTypeOpen] = useState(false);

  const loadBanks = async () => {
    try {
      const stored = await AsyncStorage.getItem('userBanks');
      if (stored) setBanks(JSON.parse(stored));
    } catch {}
  };

  const saveBanks = async (list: BankAccount[]) => {
    try { await AsyncStorage.setItem('userBanks', JSON.stringify(list)); } catch {}
  };

  const addBank = async () => {
    if (!bankForm.name.trim()) {
      Alert.alert('Missing Info', 'Please enter a bank name.');
      return;
    }
    const newBank: BankAccount = {
      id: Date.now().toString(),
      name: bankForm.name.trim(),
      type: bankForm.type,
      last4: bankForm.last4.trim().slice(-4),
    };
    const updated = [...banks, newBank];
    setBanks(updated);
    await saveBanks(updated);
    setBankForm({ name: '', type: 'Savings', last4: '' });
    setIsBankModalOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteBank = (id: string) => {
    Alert.alert('Remove Bank', 'Remove this bank account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const updated = banks.filter(b => b.id !== id);
          setBanks(updated);
          await saveBanks(updated);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const fetchProfileStats = async () => {
    try {
      setStatsLoading(true);
      const [dashRes, budgetRes] = await Promise.all([
        apiClient.get('/dashboard'),
        apiClient.get('/budgets'),
      ]);
      setProfileStats({
        monthlySpend: dashRes.data.monthlyExpense ?? 0,
        activeBudgets: Array.isArray(budgetRes.data) ? budgetRes.data.length : 0,
      });
    } catch (e) {
      console.error('Failed to fetch profile stats', e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometricHardware(compatible && enrolled);

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricTypes(types);
      }
    })();
    fetchProfileStats();
    loadBanks();
  }, []);

  const slotColor = (slot: MenuItem['slot']) => palette[slot];
  const slotDim = (slot: MenuItem['slot']) =>
    slot === 'accent' ? palette.accentDim : slot === 'danger' ? palette.dangerDim : `${palette[slot]}1A`;

  const handleCurrencyChange = (c: string) => {
    Haptics.selectionAsync();
    setCurrency(c);
  };

  const handleBiometricToggle = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBiometricEnabled(val);
  };

  const confirmLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Log out?',
      'You\u2019ll need to sign in again to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed', error);
      Alert.alert('Something went wrong', 'Could not log you out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const settingsItems: MenuItem[] = [
    { key: 'account', label: 'Account Details', icon: 'person-outline', slot: 'navy', route: '/profile/account-details' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', slot: 'accent', route: '/profile/notifications' },
    { key: 'appearance', label: 'Appearance', icon: 'color-palette-outline', slot: 'success', route: '/profile/appearance' },
  ];

  const supportItems: MenuItem[] = [
    { key: 'help', label: 'Help Center', icon: 'help-circle-outline', slot: 'navy', route: '/profile/help' },
    { key: 'privacy', label: 'Privacy Policy', icon: 'shield-checkmark-outline', slot: 'navy', route: '/profile/privacy' },
  ];

  const handleMenuPress = (item: MenuItem) => {
    if (item.route) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(item.route as any);
    }
  };

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.key}
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      activeOpacity={0.7}
      onPress={() => handleMenuPress(item)}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.settingIcon, { backgroundColor: slotDim(item.slot) }]}>
          <Ionicons name={item.icon} size={20} color={slotColor(item.slot)} />
        </View>
        <Text style={styles.menuItemText}>{item.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Screen style={{ backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGlow} />
              <View style={styles.avatar}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initials(user?.name)}</Text>
                )}
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name} numberOfLines={1}>{user?.name || 'User'}</Text>
              <Text style={styles.email} numberOfLines={1}>{user?.email || 'email@example.com'}</Text>

              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="pencil-outline" size={12} color={palette.text} style={{ marginRight: 4 }} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats — dynamic */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Monthly Spend</Text>
              {statsLoading ? (
                <View style={styles.statSkeleton} />
              ) : (
                <Text style={styles.statValue}>
                  {currency}{(profileStats?.monthlySpend ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
              )}
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Active Budgets</Text>
              {statsLoading ? (
                <View style={styles.statSkeleton} />
              ) : (
                <Text style={styles.statValue}>{profileStats?.activeBudgets ?? 0}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          {/* Currency — compact dropdown row */}
          <TouchableOpacity
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsCurrencyOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Change default currency"
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: palette.accentDim }]}>
                <Ionicons name="cash-outline" size={20} color={palette.accent} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Default Currency</Text>
                <Text style={styles.settingSubtext}>Used across all your trackers</Text>
              </View>
            </View>
            <View style={styles.dropdownValue}>
              <Text style={styles.dropdownValueText}>
                {CURRENCIES.find(c => c.symbol === currency)?.code ?? 'INR'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={palette.textMuted} style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>

          {/* Currency Modal */}
          <Modal
            visible={isCurrencyOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsCurrencyOpen(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setIsCurrencyOpen(false)}
            />
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Choose Currency</Text>
              {CURRENCIES.map((c, i) => {
                const isActive = currency === c.symbol;
                const isLast = i === CURRENCIES.length - 1;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.currencyRow, !isLast && styles.currencyRowBorder]}
                    onPress={() => {
                      handleCurrencyChange(c.symbol);
                      setIsCurrencyOpen(false);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${c.name} (${c.symbol})`}
                  >
                    <View style={[styles.currencySymbolBadge, isActive && styles.currencySymbolBadgeActive]}>
                      <Text style={[styles.currencySymbol, isActive && styles.currencySymbolActive]}>{c.symbol}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[styles.currencyName, isActive && styles.currencyNameActive]}>{c.name}</Text>
                      <Text style={styles.currencyCode}>{c.code}</Text>
                    </View>
                    {isActive && (
                      <View style={styles.currencyCheck}>
                        <Ionicons name="checkmark" size={14} color={palette.accent} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Modal>

          {hasBiometricHardware && (
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: palette.accentDim }]}>
                  <Ionicons
                    name={biometricTypes.includes(2) ? "scan-outline" : "finger-print"}
                    size={20}
                    color={palette.accent}
                  />
                </View>
                <Text style={styles.settingLabel}>
                  {biometricTypes.includes(2) ? 'Face ID Login' : 'Touch ID Login'}
                </Text>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: palette.glassBorder, true: palette.accent }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={palette.glassBorder}
              />
            </View>
          )}
        </View>
        {/* --- BANK ACCOUNTS SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Accounts</Text>

          {banks.length === 0 ? (
            <View style={styles.bankEmpty}>
              <Ionicons name="business-outline" size={28} color={palette.textMuted} />
              <Text style={styles.bankEmptyText}>No bank accounts linked yet.</Text>
            </View>
          ) : (
            <View style={styles.bankList}>
              {banks.map(b => (
                <View key={b.id} style={styles.bankRow}>
                  <View style={[styles.bankIconWrap, { backgroundColor: palette.accentDim }]}>
                    <Ionicons name="card-outline" size={20} color={palette.accent} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.bankName}>{b.name}</Text>
                    <Text style={styles.bankMeta}>{b.type}{b.last4 ? ` • •••• ${b.last4}` : ''}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteBank(b.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Remove bank"
                  >
                    <Ionicons name="trash-outline" size={18} color={palette.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.addBankBtn}
            activeOpacity={0.8}
            onPress={() => {
              setBankForm({ name: '', type: 'Savings', last4: '' });
              setIsBankModalOpen(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color={palette.accent} style={{ marginRight: 8 }} />
            <Text style={styles.addBankBtnText}>Add Bank Account</Text>
          </TouchableOpacity>
        </View>

        {/* --- ADD BANK MODAL --- */}
        <Modal
          visible={isBankModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsBankModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsBankModalOpen(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Bank Account</Text>

            {/* Bank Name */}
            <Text style={styles.bankInputLabel}>Bank Name</Text>
            <TextInput
              style={styles.bankInput}
              placeholder="e.g. HDFC, SBI, ICICI"
              placeholderTextColor={palette.textMuted}
              value={bankForm.name}
              onChangeText={v => setBankForm(f => ({ ...f, name: v }))}
              returnKeyType="next"
            />

            {/* Account Type Selector */}
            <Text style={styles.bankInputLabel}>Account Type</Text>
            <TouchableOpacity
              style={styles.bankTypeSelector}
              onPress={() => setBankTypeOpen(o => !o)}
              activeOpacity={0.8}
            >
              <Text style={styles.bankTypeSelectorText}>{bankForm.type}</Text>
              <Ionicons name={bankTypeOpen ? 'chevron-up' : 'chevron-down'} size={16} color={palette.textMuted} />
            </TouchableOpacity>
            {bankTypeOpen && (
              <View style={styles.bankTypeDropdown}>
                {BANK_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.bankTypeOption, bankForm.type === t && styles.bankTypeOptionActive]}
                    onPress={() => {
                      setBankForm(f => ({ ...f, type: t }));
                      setBankTypeOpen(false);
                    }}
                  >
                    <Text style={[styles.bankTypeOptionText, bankForm.type === t && { color: palette.accent }]}>{t}</Text>
                    {bankForm.type === t && <Ionicons name="checkmark" size={14} color={palette.accent} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Last 4 digits */}
            <Text style={styles.bankInputLabel}>Last 4 Digits (optional)</Text>
            <TextInput
              style={styles.bankInput}
              placeholder="e.g. 4321"
              placeholderTextColor={palette.textMuted}
              value={bankForm.last4}
              onChangeText={v => setBankForm(f => ({ ...f, last4: v.replace(/\D/g, '').slice(0, 4) }))}
              keyboardType="number-pad"
              maxLength={4}
            />

            <TouchableOpacity
              style={styles.bankSaveBtn}
              onPress={addBank}
              activeOpacity={0.85}
            >
              <Text style={styles.bankSaveBtnText}>Save Account</Text>
            </TouchableOpacity>
          </View>
        </Modal>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuGroup}>
            {settingsItems.map((item, i) => renderMenuItem(item, i === settingsItems.length - 1))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            {supportItems.map((item, i) => renderMenuItem(item, i === supportItems.length - 1))}
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
            onPress={confirmLogout}
            activeOpacity={0.8}
            disabled={isLoggingOut}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={20} color={palette.danger} />
            <Text style={styles.logoutButtonText}>{isLoggingOut ? 'Logging out…' : 'Log Out'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Version {APP_VERSION}</Text>

      </ScrollView>

      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
      />
    </Screen>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingHorizontal: 20, // Slightly tighter for modern feel
      paddingTop: 16,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 32, // Increased presence
      fontWeight: '800',
      color: palette.text,
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 16,
      color: palette.textMuted,
    },
    profileCard: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      ...Platform.select({
        ios: {
          shadowColor: palette.text,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.04,
          shadowRadius: 16,
        },
        android: { elevation: 2 },
      }),
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 16,
    },
    avatarGlow: {
      position: 'absolute',
      top: -4,
      left: -4,
      right: -4,
      bottom: -4,
      borderRadius: 40,
      backgroundColor: palette.accent,
      opacity: 0.15,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 24, // Squircle look
      backgroundColor: palette.navy,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '800',
    },
    profileInfo: {
      flex: 1,
    },
    name: {
      fontSize: 20,
      fontWeight: '800',
      color: palette.text,
      letterSpacing: -0.3,
      marginBottom: 2,
    },
    email: {
      fontSize: 14,
      color: palette.textMuted,
      marginBottom: 10,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: palette.surfaceAlt,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    editButtonText: {
      color: palette.text,
      fontSize: 13,
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: palette.surfaceAlt,
      borderRadius: 16,
      paddingVertical: 16,
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: palette.glassBorder,
    },
    statLabel: {
      fontSize: 12,
      color: palette.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: palette.text,
    },
    statSkeleton: {
      width: 70,
      height: 20,
      borderRadius: 6,
      backgroundColor: palette.glassBorder,
      marginTop: 4,
    },
    section: {
      marginBottom: 28,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 12,
      marginLeft: 4,
    },
    settingItem: {
      backgroundColor: palette.surface,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingLabel: {
      fontSize: 16,
      color: palette.text,
      fontWeight: '600',
    },
    settingSubtext: {
      fontSize: 12,
      color: palette.textMuted,
      marginTop: 2,
    },
    dropdownValue: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    dropdownValueText: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.accent,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalSheet: {
      backgroundColor: palette.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingBottom: 40,
      paddingTop: 12,
      borderTopWidth: 1,
      borderColor: palette.glassBorder,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.glassBorder,
      alignSelf: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: palette.text,
      marginBottom: 12,
    },
    currencyList: {
      paddingVertical: 4,
    },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderRadius: 14,
    },
    currencyRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.glassBorder,
      borderRadius: 0,
    },
    currencySymbolBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: palette.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    currencySymbolBadgeActive: {
      backgroundColor: palette.accentDim,
      borderColor: palette.accent,
    },
    currencySymbol: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.textMuted,
    },
    currencySymbolActive: {
      color: palette.accent,
    },
    currencyName: {
      fontSize: 15,
      fontWeight: '600',
      color: palette.text,
      marginBottom: 2,
    },
    currencyNameActive: {
      color: palette.accent,
    },
    currencyCode: {
      fontSize: 12,
      color: palette.textMuted,
      fontWeight: '500',
    },
    currencyCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: palette.accentDim,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // kept for compatibility (unused)
    currencyChip: { width: 0, height: 0 },
    currencyChipActive: {},
    currencyText: { fontSize: 0, color: 'transparent' },
    currencyTextActive: {
      color: palette.accent,
      fontWeight: '700',
    },
    menuGroup: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      overflow: 'hidden',
    },
    menuItem: {
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.glassBorder,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    menuItemText: {
      fontSize: 16,
      color: palette.text,
      fontWeight: '500',
    },
    logoutContainer: {
      marginTop: 8,
      marginBottom: 24,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: palette.dangerDim,
      paddingVertical: 16,
      borderRadius: 20,
    },
    logoutButtonDisabled: {
      opacity: 0.6,
    },
    logoutButtonText: {
      color: palette.danger,
      fontSize: 16,
      fontWeight: '700',
    },
    versionText: {
      fontSize: 13,
      color: palette.textMuted,
      textAlign: 'center',
      marginBottom: 8,
      fontWeight: '500',
    },

    // --- BANK ACCOUNTS ---
    bankEmpty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: palette.surfaceAlt,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    bankEmptyText: {
      fontSize: 14,
      color: palette.textMuted,
      fontWeight: '500',
    },
    bankList: {
      backgroundColor: palette.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      marginBottom: 12,
      overflow: 'hidden',
    },
    bankRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.glassBorder,
    },
    bankIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bankName: {
      fontSize: 15,
      fontWeight: '700',
      color: palette.text,
    },
    bankMeta: {
      fontSize: 12,
      color: palette.textMuted,
      marginTop: 2,
      fontWeight: '500',
    },
    addBankBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accentDim,
      borderRadius: 14,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: palette.accent,
    },
    addBankBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.accent,
    },
    bankInputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.textMuted,
      marginBottom: 6,
      marginTop: 14,
    },
    bankInput: {
      backgroundColor: palette.surfaceAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: palette.text,
    },
    bankTypeSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: palette.surfaceAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    bankTypeSelectorText: {
      fontSize: 15,
      color: palette.text,
      fontWeight: '500',
    },
    bankTypeDropdown: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.glassBorder,
      marginTop: 4,
      overflow: 'hidden',
    },
    bankTypeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.glassBorder,
    },
    bankTypeOptionActive: {
      backgroundColor: palette.accentDim,
    },
    bankTypeOptionText: {
      fontSize: 14,
      color: palette.text,
      fontWeight: '500',
    },
    bankSaveBtn: {
      backgroundColor: palette.accent,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 8,
    },
    bankSaveBtnText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#0A0A14',
    },
  });
}