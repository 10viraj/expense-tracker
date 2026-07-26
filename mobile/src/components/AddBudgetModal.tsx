import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from './ui/Input';
import { Dropdown } from './ui/Dropdown';
import apiClient from '../api/client';
import { SettingsContext } from '../context/SettingsContext';

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

interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

interface AddBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
}

export const AddBudgetModal = ({ visible, onClose, onAdd }: AddBudgetModalProps) => {
  const insets = useSafeAreaInsets();
  const { currency } = useContext(SettingsContext);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchCategories();
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setAmount('');
    setCategory(null);
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !category) {
      Alert.alert('Missing Fields', 'Please enter an amount and select a category.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      await apiClient.post('/budgets', {
        amount: parsedAmount,
        category,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      onAdd();
      onClose();
    } catch (error: any) {
      console.error('Failed to add budget:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to add budget. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    label: `${c.icon} ${c.name}`,
    value: c._id,
    color: c.color,
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlayBg} />
        
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>
          
          <View style={styles.header}>
            <Text style={styles.title}>New Budget</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={PremiumDark.textMuted} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={PremiumDark.primary} style={styles.loader} />
          ) : (
            <View style={styles.form}>
              <Input
                label={`Monthly Limit (${currency}) *`}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                icon="cash-outline"
              />

              <Dropdown
                label="Category *"
                options={categoryOptions}
                selectedValue={category}
                onSelect={setCategory}
                placeholder="Select a category"
                icon="pricetag-outline"
              />

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={PremiumDark.background} />
                ) : (
                  <Text style={styles.submitBtnText}>Create Budget</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: PremiumDark.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: PremiumDark.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  dragHandleWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: PremiumDark.textMuted,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: PremiumDark.textMain,
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  form: {
    gap: 16,
  },
  loader: {
    marginVertical: 40,
  },
  submitBtn: {
    backgroundColor: PremiumDark.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: PremiumDark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: {
    color: PremiumDark.background,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
