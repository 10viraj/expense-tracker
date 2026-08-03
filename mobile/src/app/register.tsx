import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';
import { lightPalette, darkPalette } from '@/app/theme/fintechPalette';
import { createAuthStyles } from '@/app/theme/authStyles';
import { FintechInput } from '@/app/components/FintechInput';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterScreen() {
  const isDark = useColorScheme() === 'dark';
  const palette = isDark ? darkPalette : lightPalette;
  const styles = useMemo(() => createAuthStyles(palette), [palette]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);
  const { login } = useContext(AuthContext);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert('Missing information', 'Please fill in your name, email, and password to continue.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Password too short', `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);

    // Registration and sign-in are two separate failure points. If the
    // account is created but the subsequent login fails, the user shouldn't
    // be told registration itself failed — that leads them to retry and hit
    // a confusing "email already in use" error on an account that already
    // exists and works.
    let response;
    try {
      response = await apiClient.post('/auth/register', {
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
    } catch (error: any) {
      console.error('Registration Error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to register';
      Alert.alert('Registration Failed', message);
      setIsLoading(false);
      return;
    }

    try {
      await login(
        { id: response.data._id, name: response.data.name, email: response.data.email },
        response.data.token
      );
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Post-registration Login Error:', error);
      Alert.alert(
        'Account created',
        'Your account was created, but we couldn\u2019t sign you in automatically. Please sign in.'
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Ionicons name="trending-up" size={22} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start taking control of your money</Text>
          </View>

          <View style={styles.card}>
            <FintechInput
              palette={palette}
              label="Full name"
              placeholder="Jane Doe"
              icon="person-outline"
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
              value={name}
              onChangeText={setName}
              focused={focusedField === 'name'}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />

            <View style={styles.fieldGap} />

            <FintechInput
              palette={palette}
              label="Email address"
              placeholder="you@example.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              focused={focusedField === 'email'}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />

            <View style={styles.fieldGap} />

            <FintechInput
              palette={palette}
              label="Password"
              placeholder="Create a strong password"
              icon="lock-closed-outline"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoComplete="password-new"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              value={password}
              onChangeText={setPassword}
              focused={focusedField === 'password'}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={palette.textMuted}
                  />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled, { marginTop: 20 }]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{isLoading ? 'Creating account…' : 'Sign Up'}</Text>
              {!isLoading && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </View>

          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={palette.textMuted} />
            <Text style={styles.trustText}>256-bit encrypted connection</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}