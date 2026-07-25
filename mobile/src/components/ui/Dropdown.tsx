import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PremiumDark = {
  background: '#09090E',
  surface: '#151520',
  surfaceLight: '#212130',
  textMain: '#F2F2F5',
  textMuted: '#8F8F9D',
  primary: '#00F0FF',
  danger: '#FF3366',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
};

interface Option {
  label: string;
  value: string;
  color?: string;
}

interface DropdownProps {
  label: string;
  options: Option[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const Dropdown = ({ label, options, selectedValue, onSelect, placeholder = 'Select an option', icon }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity 
        style={[styles.dropdownButton, isOpen && styles.dropdownButtonFocused]} 
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownLeft}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={isOpen ? PremiumDark.primary : PremiumDark.textMuted} 
              style={styles.icon} 
            />
          )}
          <Text style={[styles.selectedValue, !selectedOption && styles.placeholder]}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={isOpen ? PremiumDark.primary : PremiumDark.textMuted} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedValue === item.value && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setIsOpen(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.optionText, 
                      selectedValue === item.value && styles.optionTextSelected,
                      item.color ? { color: item.color } : {}
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedValue === item.value && (
                    <Ionicons name="checkmark" size={20} color={item.color || PremiumDark.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    color: PremiumDark.textMuted,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dropdownButton: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: PremiumDark.glassBorder,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonFocused: {
    borderColor: PremiumDark.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.06)',
    shadowColor: PremiumDark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  selectedValue: {
    color: PremiumDark.textMain,
    fontSize: 16,
    fontWeight: '500',
  },
  placeholder: {
    color: PremiumDark.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 14, 0.8)', // PremiumDark.background with opacity
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: PremiumDark.surface,
    borderRadius: 32,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: PremiumDark.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  modalTitle: {
    color: PremiumDark.textMain,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  optionText: {
    color: PremiumDark.textMain,
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextSelected: {
    fontWeight: '800',
  },
});
