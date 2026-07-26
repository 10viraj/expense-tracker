import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PremiumDark = {
  surface: '#151520',
  textMain: '#F2F2F5',
  textMuted: '#8F8F9D',
  primary: '#00F0FF',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

interface SearchBarProps extends TextInputProps {
  onClear?: () => void;
}

export function SearchBar({ value, onClear, style, ...props }: SearchBarProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search" size={20} color={PremiumDark.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholderTextColor={PremiumDark.textMuted}
        value={value}
        {...props}
      />
      {value ? (
        <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={18} color={PremiumDark.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumDark.surface,
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: PremiumDark.textMain,
    fontSize: 16,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
    marginLeft: 8,
  }
});
