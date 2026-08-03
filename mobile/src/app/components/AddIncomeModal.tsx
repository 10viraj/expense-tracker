import React, { useContext, useState } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';
import { SettingsContext } from '../../context/SettingsContext';

const PremiumDark = {
    background: '#09090E',
    surface: '#151520',
    surfaceLight: '#1C1C28',
    textMain: '#F2F2F5',
    textMuted: '#8F8F9D',
    success: '#00E676',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
};

const QUICK_SOURCES = [
    { name: 'Salary', icon: '💼' },
    { name: 'Freelance', icon: '🧑‍💻' },
    { name: 'Investment', icon: '📈' },
    { name: 'Gift', icon: '🎁' },
    { name: 'Other', icon: '💰' },
];

type Props = {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

export function AddIncomeModal({ visible, onClose, onSuccess }: Props) {
    const { currency } = useContext(SettingsContext);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState(QUICK_SOURCES[0].name);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reset = () => {
        setTitle('');
        setAmount('');
        setSource(QUICK_SOURCES[0].name);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        const numericAmount = parseFloat(amount);
        if (!title.trim()) {
            Alert.alert('Missing title', 'Give this income a short title.');
            return;
        }
        if (!numericAmount || numericAmount <= 0) {
            Alert.alert('Invalid amount', 'Enter an amount greater than zero.');
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/incomes', {
                title: title.trim(),
                amount: numericAmount,
                source,
                date: new Date().toISOString(),
            });
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to add income', error);
            Alert.alert('Something went wrong', 'Could not save this income. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={styles.backdrop}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.sheetWrap}
                >
                    <View style={styles.sheet}>
                        <View style={styles.handle} />

                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Add Income</Text>
                            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={24} color={PremiumDark.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Amount</Text>
                            <View style={styles.amountRow}>
                                <Text style={styles.currencySymbol}>{currency}</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0.00"
                                    placeholderTextColor={PremiumDark.textMuted}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g. August paycheck"
                                placeholderTextColor={PremiumDark.textMuted}
                            />

                            <Text style={styles.label}>Source</Text>
                            <View style={styles.sourceGrid}>
                                {QUICK_SOURCES.map((s) => {
                                    const isActive = source === s.name;
                                    return (
                                        <TouchableOpacity
                                            key={s.name}
                                            style={[styles.sourceChip, isActive && styles.sourceChipActive]}
                                            onPress={() => setSource(s.name)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.sourceIcon}>{s.icon}</Text>
                                            <Text style={[styles.sourceLabel, isActive && styles.sourceLabelActive]}>
                                                {s.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                activeOpacity={0.85}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color={PremiumDark.background} />
                                ) : (
                                    <Text style={styles.submitButtonText}>Save Income</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheetWrap: {
        width: '100%',
    },
    sheet: {
        backgroundColor: PremiumDark.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 32,
        maxHeight: '85%',
        borderWidth: 1,
        borderColor: PremiumDark.glassBorder,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: PremiumDark.glassBorder,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: PremiumDark.textMain,
        letterSpacing: -0.3,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: PremiumDark.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginTop: 18,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PremiumDark.surfaceLight,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: PremiumDark.glassBorder,
        paddingHorizontal: 18,
    },
    currencySymbol: {
        fontSize: 26,
        fontWeight: '800',
        color: PremiumDark.success,
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 26,
        fontWeight: '800',
        color: PremiumDark.textMain,
        paddingVertical: 16,
    },
    input: {
        backgroundColor: PremiumDark.surfaceLight,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: PremiumDark.glassBorder,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 16,
        color: PremiumDark.textMain,
        fontWeight: '600',
    },
    sourceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    sourceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: PremiumDark.surfaceLight,
        borderWidth: 1,
        borderColor: PremiumDark.glassBorder,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    sourceChipActive: {
        borderColor: PremiumDark.success,
        backgroundColor: `${PremiumDark.success}18`,
    },
    sourceIcon: {
        fontSize: 16,
    },
    sourceLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: PremiumDark.textMuted,
    },
    sourceLabelActive: {
        color: PremiumDark.success,
    },
    submitButton: {
        backgroundColor: PremiumDark.success,
        borderRadius: 18,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 28,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: PremiumDark.background,
    },
});