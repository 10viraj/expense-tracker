import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Dropdown } from './ui/Dropdown';
import apiClient from '../api/client';

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

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Other'];

const PREDEFINED_CATEGORIES = [
  { label: '🍔 Food', value: 'Food' },
  { label: '🛒 Groceries', value: 'Groceries' },
  { label: '🏠 Home', value: 'Home' },
  { label: '🚗 Transport', value: 'Transport' },
  { label: '⛽ Fuel', value: 'Fuel' },
  { label: '💡 Bills', value: 'Bills' },
  { label: '🛍️ Shopping', value: 'Shopping' },
  { label: '🎬 Entertainment', value: 'Entertainment' },
  { label: '🏥 Health', value: 'Health' },
  { label: '✈️ Travel', value: 'Travel' },
  { label: '📚 Education', value: 'Education' },
  { label: '💼 Work', value: 'Work' },
  { label: '💳 EMI & Loans', value: 'EMI & Loans' },
  { label: '📱 Subscriptions', value: 'Subscriptions' },
  { label: '🎁 Gifts', value: 'Gifts' },
  { label: '🐶 Pets', value: 'Pets' },
  { label: '❤️ Personal Care', value: 'Personal Care' },
  { label: '💰 Investment', value: 'Investment' },
  { label: '📦 Miscellaneous', value: 'Miscellaneous' },
];

type Category = {
  _id: string;
  name: string;
  color: string;
};

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddExpenseModal = ({ visible, onClose, onSuccess }: AddExpenseModalProps) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchCategories();
      // Reset form
      setTitle('');
      setAmount('');
      setCategoryId(null);
      setPaymentMethod('Cash');
      setNotes('');
      setError(null);
    }
  }, [visible]);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const res = await apiClient.get('/categories');
      setCategories(res.data || []);
      if (!categoryId) {
        setCategoryId(PREDEFINED_CATEGORIES[0].value);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !amount || !categoryId || !paymentMethod) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Find if category already exists in backend
      let backendCategoryId = categories.find(c => c.name === categoryId)?._id;
      
      // If it doesn't exist, create it first
      if (!backendCategoryId) {
        const selectedPredefined = PREDEFINED_CATEGORIES.find(c => c.value === categoryId);
        // Extract emoji
        const emojiMatch = selectedPredefined?.label.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u);
        const icon = emojiMatch ? emojiMatch[1] : '';
        
        const newCatRes = await apiClient.post('/categories', {
          name: categoryId,
          icon,
          type: 'expense',
          color: PremiumDark.primary, // Default color
        });
        backendCategoryId = newCatRes.data._id;
      }

      const payload = {
        title,
        amount: parseFloat(amount),
        category: backendCategoryId,
        paymentMethod,
        notes,
        date: new Date().toISOString(),
      };

      await apiClient.post('/expenses', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add expense:', err);
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom + 24, 24) }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={PremiumDark.textMain} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Title & Amount */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Title *"
                  placeholder="E.g., Groceries"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor={PremiumDark.textMuted}
                  style={styles.inputStyle}
                  icon="text"
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.flex1}>
                <Input
                  label="Amount *"
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholderTextColor={PremiumDark.textMuted}
                  style={styles.inputStyle}
                  icon="cash-outline"
                />
              </View>
            </View>

            {/* Category Dropdown */}
            {isLoadingCategories ? (
              <ActivityIndicator color={PremiumDark.primary} style={{ marginVertical: 12 }} />
            ) : (
              <Dropdown
                label="Category *"
                options={PREDEFINED_CATEGORIES}
                selectedValue={categoryId}
                onSelect={setCategoryId}
                placeholder="Select category"
                icon="grid-outline"
              />
            )}

            {/* Payment Method Dropdown */}
            <Dropdown
              label="Payment Method *"
              options={PAYMENT_METHODS.map((m) => ({ label: m, value: m }))}
              selectedValue={paymentMethod}
              onSelect={setPaymentMethod}
              icon="card-outline"
            />

            <Input
              label="Notes"
              placeholder="Optional notes"
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor={PremiumDark.textMuted}
              style={styles.inputStyle}
              icon="document-text-outline"
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Add Expense"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                style={styles.submitButton}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: PremiumDark.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    maxHeight: '90%',
  },
  dragHandleWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: PremiumDark.glassBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PremiumDark.textMain,
  },
  closeButton: {
    padding: 8,
    backgroundColor: PremiumDark.surfaceLight,
    borderRadius: 20,
  },
  content: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  label: {
    color: PremiumDark.textMuted,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    marginTop: 8,
  },
  inputStyle: {
    backgroundColor: PremiumDark.surfaceLight,
    color: PremiumDark.textMain,
    borderColor: PremiumDark.glassBorder,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 20,
    shadowColor: PremiumDark.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButton: {
    backgroundColor: PremiumDark.primary,
  },
  errorText: {
    color: PremiumDark.danger,
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
});
