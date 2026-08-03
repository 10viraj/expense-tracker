import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Switch, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { lightPalette, darkPalette } from '../../theme/fintechPalette';
import * as Haptics from 'expo-haptics';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? darkPalette : lightPalette;

  const [toggles, setToggles] = useState({
    transactions: true,
    budgetAlerts: true,
    marketing: false,
    security: true,
  });

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const toggleSwitch = (key: keyof typeof toggles) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderToggle = (key: keyof typeof toggles, title: string, desc: string) => (
    <View style={[styles.row, { borderBottomColor: palette.glassBorder }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.desc, { color: palette.textMuted }]}>{desc}</Text>
      </View>
      <Switch
        value={toggles[key]}
        onValueChange={() => toggleSwitch(key)}
        trackColor={{ false: palette.glassBorder, true: palette.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={palette.glassBorder}
      />
    </View>
  );

  return (
    <Screen style={{ backgroundColor: palette.bg }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.glassBorder }]}>
          {renderToggle('transactions', 'Transactions', 'Get notified for every income and expense')}
          {renderToggle('budgetAlerts', 'Budget Alerts', 'Warnings when you approach budget limits')}
          {renderToggle('security', 'Security Alerts', 'Unusual activity and login attempts')}
          {renderToggle('marketing', 'Promotions', 'Offers and news from our partners')}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  container: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
  }
});
