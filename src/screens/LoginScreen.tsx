import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '../firebase/config';
import { useTheme } from '../theme/ThemeContext';
import { AppColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

WebBrowser.maybeCompleteAuthSession();

// ─── Google OAuth Client IDs ──────────────────────────────────────────────────
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (!id_token) {
        Alert.alert('Google Sign-In Failed', 'No ID token received.');
        return;
      }
      setIsGoogleLoading(true);
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .catch((err: any) => {
          Alert.alert('Google Sign-In Failed', err.message);
          setIsGoogleLoading(false);
        });
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In Error', response.error?.message ?? 'Unknown error');
    }
  }, [response]);

  // Clear validation when switching tabs
  const handleToggleMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setValidationError('');
  };

  const handleAuth = async () => {
    setValidationError('');
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // Validation
    if (!trimmedEmail) {
      setValidationError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp) {
      if (!trimmedName) {
        setValidationError('Please enter your name.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { user } = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(user, { displayName: trimmedName });
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (err: any) {
      setIsLoading(false);
      let message = err.message || 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Try signing in.';
      }
      setValidationError(message);
    }
  };

  const handleForgotPassword = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Password Reset', 'Please enter your registered email address above first.');
      return;
    }
    Alert.alert(
      'Reset Password',
      `Send a password reset link to ${trimmedEmail}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, trimmedEmail);
              Alert.alert('Email Sent', 'Check your inbox for password reset instructions.');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const busy = isLoading || isGoogleLoading;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand Hero ── */}
        <View style={styles.hero}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🧭</Text>
          </View>
          <Text style={styles.appName}>Explora</Text>
          <Text style={styles.tagline}>
            Discover Hidden Bangladesh • Tours & Community
          </Text>
        </View>

        {/* ── Mode Segment Tabs ── */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, !isSignUp && styles.segmentBtnActive]}
            onPress={() => handleToggleMode(false)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: !isSignUp }}
          >
            <Text style={[styles.segmentText, !isSignUp && styles.segmentTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, isSignUp && styles.segmentBtnActive]}
            onPress={() => handleToggleMode(true)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSignUp }}
          >
            <Text style={[styles.segmentText, isSignUp && styles.segmentTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Validation Banner ── */}
        {validationError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        ) : null}

        {/* ── Form Inputs ── */}
        <View style={styles.form}>
          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Alex Rahman"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="you@domain.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>

            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeTxt}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>

            </View>
            {!isSignUp && (
              <TouchableOpacity onPress={handleForgotPassword} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.forgotTxt}>Forgot?</Text>
              </TouchableOpacity>
            )}
          </View>

          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeTxt}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
                {!isSignUp && (
                  <TouchableOpacity onPress={handleForgotPassword} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.forgotTxt}>Forgot?</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          {/* Primary Submit */}
          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={handleAuth}
            disabled={busy}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Create Explora Account' : 'Sign in to Explora'}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnTxt}>
                {isSignUp ? 'Create Account →' : 'Sign In →'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={[styles.googleBtn, (busy || !request) && styles.btnDisabled]}
            onPress={() => promptAsync()}
            disabled={!request || busy}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleTxt}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: AppColors, isDark: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: Spacing.xl,
    },
    hero: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    logoBadge: {
      width: 68,
      height: 68,
      borderRadius: Radius['2xl'],
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      ...Platform.select({
        ios: {
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    logoEmoji: {
      fontSize: 34,
    },
    appName: {
      fontSize: 32,
      fontWeight: Typography.weight.heavy,
      color: c.text,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: Typography.size.sm,
      color: c.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },

    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: Radius.full,
      padding: 4,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: Spacing.sm + 2,
      alignItems: 'center',
      borderRadius: Radius.full,
    },
    segmentBtnActive: {
      backgroundColor: c.primary,
    },
    segmentText: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semiBold,
      color: c.textSecondary,
    },
    segmentTextActive: {
      color: c.textInverse,
      fontWeight: Typography.weight.bold,
    },

    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.error + '15',
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: c.error + '40',
      gap: Spacing.sm,
    },
    errorIcon: {
      fontSize: 16,
    },
    errorText: {
      flex: 1,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semiBold,
      color: c.error,
    },

    form: {
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    inputGroup: {
      gap: 6,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingLeft: 2,
    },
    forgotTxt: {
      fontSize: Typography.size.s,
      fontWeight: Typography.weight.semiBold,
      color: c.primary,
      textAlign: 'center'
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.xl,
      paddingHorizontal: Spacing.md,
    },
    inputIcon: {
      fontSize: 16,
      marginRight: Spacing.sm,
      opacity: 0.7,
    },
    input: {
      flex: 1,
      paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm + 2,
      fontSize: Typography.size.base,
      color: c.text,
    },
    eyeBtn: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.xs,
    },
    eyeTxt: {
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.bold,
      color: c.primary,
    },

    actions: {
      gap: Spacing.md,
    },
    primaryBtn: {
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.xl,
      paddingVertical: Spacing.md + 2,
      ...Platform.select({
        ios: {
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    btnDisabled: {
      opacity: 0.6,
    },
    primaryBtnTxt: {
      fontSize: Typography.size.base,
      fontWeight: Typography.weight.bold,
      color: c.textInverse,
    },

    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginVertical: 4,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
    },
    dividerTxt: {
      fontSize: Typography.size.xs,
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.xl,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    googleG: {
      fontSize: 18,
      fontWeight: '800',
      color: '#4285F4',
    },
    googleTxt: {
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.bold,
      color: c.text,
    },
  });
}
