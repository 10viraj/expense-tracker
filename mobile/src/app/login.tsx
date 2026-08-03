import React, { useState, useContext, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  useColorScheme,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';

// ---------------------------------------------------------------------------
// Theme — professional fintech palette (dark navy, crisp, trustworthy)
// Swap this out for your existing theme system if you have one; the screen
// below only depends on the shape of `palette`, not where it comes from.
// ---------------------------------------------------------------------------
const lightPalette = {
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F6',
  border: '#E2E6EE',
  navy: '#0B1E39',
  navySoft: '#122A4D',
  accent: '#2F6FED',
  accentSoft: '#EAF1FF',
  text: '#0B1220',
  textMuted: '#5B6472',
  placeholder: '#98A1AF',
  danger: '#E5484D',
  success: '#1FA971',
};

const darkPalette = {
  bg: '#070D18',
  surface: '#0F1B30',
  surfaceAlt: '#132140',
  border: '#1E2E4F',
  navy: '#0B1E39',
  navySoft: '#16294A',
  accent: '#5B9CFF',
  accentSoft: '#122A4D',
  text: '#EDF1F7',
  textMuted: '#8D97AC',
  placeholder: '#5A6478',
  danger: '#FF6B6E',
  success: '#3FCB8F',
};

export default function LoginScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const palette = isDark ? darkPalette : lightPalette;
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<number[]>([]);
  const { login, isBiometricEnabled, setBiometricEnabled } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometricHardware(compatible && enrolled);

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricTypes(types);
      }

      // Auto-prompt if enabled
      if (isBiometricEnabled && compatible && enrolled) {
        handleBiometricLogin();
      }
    })();
  }, [isBiometricEnabled]);

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser);
          await login(user, storedToken);
          router.replace('/(tabs)');
        } else {
          Alert.alert('Session Expired', 'Please login with your password.');
        }
      }
    } catch (error) {
      console.error('Biometric auth error', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing information', 'Please enter your email and password to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const user = { id: response.data._id, name: response.data.name, email: response.data.email };
      const token = response.data.token;

      await login(user, token);

      if (hasBiometricHardware && !isBiometricEnabled) {
        Alert.alert(
          'Enable Biometrics',
          'Would you like to use FaceID/TouchID for future logins?',
          [
            { text: 'No', style: 'cancel', onPress: () => router.replace('/(tabs)') },
            {
              text: 'Yes',
              onPress: async () => {
                await setBiometricEnabled(true);
                router.replace('/(tabs)');
              }
            }
          ]
        );
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Login Error Full:', error);
      const message = error.response?.data?.message || error.message || 'Failed to login';
      Alert.alert('Login Failed', message);
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
          {/* Brand mark */}
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Ionicons name="trending-up" size={22} color={isDark ? darkPalette.accent : '#FFFFFF'} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to keep tracking your spending</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <FintechInput
              palette={palette}
              label="Email address"
              placeholder="you@example.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              focused={focusedField === 'email'}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />

            <View style={{ height: 16 }} />

            <FintechInput
              palette={palette}
              label="Password"
              placeholder="Enter your password"
              icon="lock-closed-outline"
              secureTextEntry={!showPassword}
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

            <TouchableOpacity style={styles.forgotPassword} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {hasBiometricHardware && isBiometricEnabled && (
              <TouchableOpacity
                style={styles.biometricBtn}
                onPress={handleBiometricLogin}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={biometricTypes.includes(2) ? "scan-outline" : "finger-print"}
                  size={20}
                  color={palette.accent}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.biometricBtnText}>
                  {biometricTypes.includes(2) ? 'Login with Fingerprint' : 'Login with Touch ID'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>{isLoading ? 'Signing in…' : 'Sign In'}</Text>
              {!isLoading && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </View>

          {/* Trust signal */}
          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={palette.textMuted} />
            <Text style={styles.trustText}>256-bit encrypted connection</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.registerText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Reusable labeled input with icon + floating focus border
// ---------------------------------------------------------------------------
function FintechInput({
  palette,
  label,
  icon,
  rightElement,
  focused,
  ...inputProps
}: any) {
  const styles = createStyles(palette);
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
        <Ionicons name={icon} size={18} color={focused ? palette.accent : palette.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          placeholderTextColor={palette.placeholder}
          {...inputProps}
        />
        {rightElement}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
function createStyles(palette: typeof lightPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: palette.bg,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 72,
      paddingBottom: 32,
    },
    brandRow: {
      alignItems: 'center',
      marginBottom: 28,
    },
    brandMark: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: palette.navy,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 14.5,
      color: palette.textMuted,
      textAlign: 'center',
    },
    card: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      padding: 22,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
    inputLabel: {
      fontSize: 12.5,
      fontWeight: '600',
      color: palette.textMuted,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surfaceAlt,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'transparent',
      paddingHorizontal: 14,
      height: 50,
    },
    inputWrapperFocused: {
      borderColor: palette.accent,
      backgroundColor: palette.surface,
    },
    input: {
      flex: 1,
      fontSize: 15.5,
      color: palette.text,
      paddingVertical: 0,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: 14,
      marginBottom: 20,
    },
    forgotPasswordText: {
      color: palette.accent,
      fontSize: 13.5,
      fontWeight: '600',
    },
    loginBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.navy,
      borderRadius: 12,
      height: 52,
      shadowColor: palette.navy,
      shadowOpacity: 0.3,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    biometricBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surfaceAlt,
      borderRadius: 12,
      height: 52,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: palette.border,
    },
    biometricBtnText: {
      color: palette.accent,
      fontSize: 15,
      fontWeight: '600',
    },
    loginBtnDisabled: {
      opacity: 0.7,
    },
    loginBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    trustRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
      gap: 6,
    },
    trustText: {
      fontSize: 12,
      color: palette.textMuted,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 'auto',
      paddingTop: 36,
    },
    footerText: {
      color: palette.textMuted,
      fontSize: 14.5,
    },
    registerText: {
      color: palette.accent,
      fontSize: 14.5,
      fontWeight: '700',
    },
  });
}