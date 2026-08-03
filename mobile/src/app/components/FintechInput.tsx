import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemePalette } from '../theme/fintechPalette';

interface FintechInputProps extends TextInputProps {
  palette: ThemePalette;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  rightElement?: React.ReactNode;
}

export function FintechInput({
  palette,
  label,
  icon,
  focused,
  rightElement,
  ...rest
}: FintechInputProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          { 
            backgroundColor: palette.background,
            borderColor: focused ? palette.primary : palette.border,
            borderWidth: focused ? 2 : 1,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={focused ? palette.primary : palette.textMuted}
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, { color: palette.text }]}
          placeholderTextColor={palette.textMuted}
          {...rest}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  rightElement: {
    marginLeft: 12,
  },
});
