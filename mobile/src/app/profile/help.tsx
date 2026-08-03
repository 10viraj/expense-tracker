import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { lightPalette, darkPalette } from '../../theme/fintechPalette';
import * as Haptics from 'expo-haptics';

export default function HelpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? darkPalette : lightPalette;

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handlePress = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Fake handling for now
  };

  const renderItem = (label: string, icon: any, url: string) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: palette.glassBorder }]}
      onPress={() => handlePress(url)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color={palette.text} style={styles.icon} />
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Screen style={{ backgroundColor: palette.bg }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Help Center</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.glassBorder }]}>
          {renderItem('FAQ', 'help-circle-outline', '#')}
          {renderItem('Contact Support', 'mail-outline', '#')}
          {renderItem('Report a Bug', 'bug-outline', '#')}
          {renderItem('Community Forum', 'people-outline', '#')}
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
  }
});
