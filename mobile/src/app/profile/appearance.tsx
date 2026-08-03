import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { lightPalette, darkPalette } from '../../theme/fintechPalette';
import * as Haptics from 'expo-haptics';

export default function AppearanceScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? darkPalette : lightPalette;
  
  // Fake state since global app state would require Context to override device preference
  const [theme, setTheme] = useState(isDark ? 'dark' : 'light');

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const selectTheme = (t: string) => {
    Haptics.selectionAsync();
    setTheme(t);
  };

  const renderOption = (key: string, label: string, icon: any) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: palette.glassBorder }]}
      onPress={() => selectTheme(key)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color={palette.text} style={styles.icon} />
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      </View>
      {theme === key && <Ionicons name="checkmark" size={20} color={palette.accent} />}
    </TouchableOpacity>
  );

  return (
    <Screen style={{ backgroundColor: palette.bg }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Appearance</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>THEME</Text>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.glassBorder }]}>
          {renderOption('light', 'Light Mode', 'sunny-outline')}
          {renderOption('dark', 'Dark Mode', 'moon-outline')}
          {renderOption('system', 'System Default', 'phone-portrait-outline')}
        </View>
        <Text style={[styles.footerText, { color: palette.textMuted }]}>
          System default will match your device's settings.
        </Text>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 8,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 13,
    paddingHorizontal: 12,
  }
});
