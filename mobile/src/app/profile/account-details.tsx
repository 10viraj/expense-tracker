import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { lightPalette, darkPalette } from '../../theme/fintechPalette';
import { AuthContext } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';

export default function AccountDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = isDark ? darkPalette : lightPalette;
  const { user } = useContext(AuthContext);

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
        <Text style={[styles.headerTitle, { color: palette.text }]}>Account Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.glassBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.textMuted }]}>Name</Text>
            <Text style={[styles.value, { color: palette.text }]}>{user?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.textMuted }]}>Email</Text>
            <Text style={[styles.value, { color: palette.text }]}>{user?.email || 'No email'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.textMuted }]}>Account Status</Text>
            <Text style={[styles.value, { color: palette.success }]}>Active</Text>
          </View>
        </View>

        <Text style={[styles.footerText, { color: palette.textMuted }]}>
          To update your details, please use the Edit Profile button on the main profile screen.
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  }
});
