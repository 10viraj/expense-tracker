import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { lightPalette, darkPalette } from '../../theme/fintechPalette';
import * as Haptics from 'expo-haptics';

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? darkPalette : lightPalette;

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <Screen style={{ backgroundColor: palette.bg }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.glassBorder }]}>
          <Text style={[styles.title, { color: palette.text }]}>Data Protection</Text>
          <Text style={[styles.paragraph, { color: palette.textMuted }]}>
            Your financial data is encrypted and securely stored. We never sell your personal information to third parties.
          </Text>

          <Text style={[styles.title, { color: palette.text }]}>Data Collection</Text>
          <Text style={[styles.paragraph, { color: palette.textMuted }]}>
            We collect the information you provide, such as expenses, budgets, and linked bank accounts, solely for the purpose of providing you with our tracking services.
          </Text>

          <Text style={[styles.title, { color: palette.text }]}>Third-Party Services</Text>
          <Text style={[styles.paragraph, { color: palette.textMuted }]}>
            We may use third-party services for analytics and crash reporting. These services are bound by strict data processing agreements.
          </Text>

          <Text style={[styles.title, { color: palette.text }]}>Your Rights</Text>
          <Text style={[styles.paragraph, { color: palette.textMuted }]}>
            You have the right to request a copy of your data or have your account permanently deleted at any time through the Help Center.
          </Text>
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
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  }
});
