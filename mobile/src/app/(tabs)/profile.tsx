import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { EditProfileModal } from '../../components/EditProfileModal';
import { AuthContext } from '../../context/AuthContext';
import { SettingsContext } from '../../context/SettingsContext';

const PremiumDark = {
  background: '#09090E',
  surface: '#151520',
  surfaceLight: '#212130',
  textMain: '#F2F2F5',
  textMuted: '#8F8F9D',
  primary: '#00F0FF',
  danger: '#FF3366',
  warning: '#FFB800',
  accent: '#B047FF',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

const CURRENCIES = ['₹', '$', '€', '£'];

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const { currency, setCurrency } = useContext(SettingsContext);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name?: string) => {
    return (name || 'U').charAt(0).toUpperCase();
  };

  return (
    <Screen style={{ backgroundColor: PremiumDark.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            )}
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
          
          <TouchableOpacity 
            style={styles.editButton} 
            activeOpacity={0.7}
            onPress={() => setIsEditModalVisible(true)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${PremiumDark.primary}1A` }]}>
                <Ionicons name="cash-outline" size={20} color={PremiumDark.primary} />
              </View>
              <Text style={styles.settingLabel}>Currency</Text>
            </View>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity 
                  key={c}
                  style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                  onPress={() => setCurrency(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${PremiumDark.accent}1A` }]}>
                <Ionicons name="person-outline" size={20} color={PremiumDark.accent} />
              </View>
              <Text style={styles.menuItemText}>Account Details</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={PremiumDark.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${PremiumDark.warning}1A` }]}>
                <Ionicons name="notifications-outline" size={20} color={PremiumDark.warning} />
              </View>
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={PremiumDark.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${PremiumDark.primary}1A` }]}>
                <Ionicons name="color-palette-outline" size={20} color={PremiumDark.primary} />
              </View>
              <Text style={styles.menuItemText}>Appearance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={PremiumDark.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${PremiumDark.textMain}1A` }]}>
                <Ionicons name="help-circle-outline" size={20} color={PremiumDark.textMain} />
              </View>
              <Text style={styles.menuItemText}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={PremiumDark.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${PremiumDark.textMain}1A` }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={PremiumDark.textMain} />
              </View>
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={PremiumDark.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={22} color={PremiumDark.danger} />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <EditProfileModal 
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  profileCard: {
    alignItems: 'center',
    backgroundColor: PremiumDark.surface,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarGlow: {
    position: 'absolute',
    top: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: PremiumDark.primary,
    opacity: 0.15,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: PremiumDark.surfaceLight,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: PremiumDark.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarText: {
    color: PremiumDark.textMain,
    fontSize: 36,
    fontWeight: '800',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: PremiumDark.textMain,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: PremiumDark.textMuted,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
  },
  editButtonText: {
    color: PremiumDark.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PremiumDark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  settingItem: {
    backgroundColor: PremiumDark.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: PremiumDark.textMain,
    fontWeight: '600',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: PremiumDark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currencyChipActive: {
    backgroundColor: `${PremiumDark.primary}22`,
    borderColor: PremiumDark.primary,
  },
  currencyText: {
    color: PremiumDark.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  currencyTextActive: {
    color: PremiumDark.primary,
  },
  menuItem: {
    backgroundColor: PremiumDark.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: PremiumDark.textMain,
    fontWeight: '600',
  },
  logoutContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: `${PremiumDark.danger}1A`,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PremiumDark.danger,
  },
  logoutButtonText: {
    color: PremiumDark.danger,
    fontSize: 17,
    fontWeight: '700',
  },
});
