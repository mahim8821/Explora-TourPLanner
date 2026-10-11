import React, { useState, useEffect } from 'react';
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
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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

  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (!id_token) { Alert.alert('Google Sign-In Failed', 'No ID token received.'); return; }
      setIsGoogleLoading(true);
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch((err: any) => {
        Alert.alert('Google Sign-In Failed', err.message);
        setIsGoogleLoading(false);
      });
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In Error', response.error?.message ?? 'Unknown error');
    }
  }, [response]);

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Error', err.message);
    }
  };

  const busy = isLoading || isGoogleLoading;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Hero */}
        <View style={styles.hero}>
          <Text style={[styles.appName, { color: colors.text }]}>Explora</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Alex Johnson"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="alex@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Primary Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, busy && styles.btnDisabled]}
            onPress={handleAuth}
            disabled={busy}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.primaryBtnTxt}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerTxt, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: colors.surface, borderColor: colors.border }, (busy || !request) && styles.btnDisabled]}
            onPress={() => promptAsync()}
            disabled={!request || busy}
            activeOpacity={0.85}
          >
            {isGoogleLoading
              ? <ActivityIndicator color={colors.text} size="small" />
              : <>
                <Text style={styles.googleG}>G</Text>
                <Text style={[styles.googleTxt, { color: colors.text }]}>Continue with Google</Text>
              </>
            }
          </TouchableOpacity>

          {/* Toggle */}
          <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={[styles.toggleTxt, { color: colors.textMuted }]}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={{ color: colors.primary, fontWeight: Typography.weight.semiBold }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingBottom: 48 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 80, paddingBottom: Spacing['2xl'] },
  logoEmoji: { fontSize: 52, marginBottom: Spacing.md },
  appName: { fontSize: 36, fontWeight: Typography.weight.heavy, letterSpacing: -1 },
  tagline: { fontSize: Typography.size.base, marginTop: Spacing.xs },

  // Form
  form: { gap: Spacing.lg, marginBottom: Spacing.xl },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, paddingLeft: 2 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.size.base,
  },

  // Actions
  actions: { gap: Spacing.base },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base + 2,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnTxt: { fontSize: Typography.size.base, fontWeight: Typography.weight.semiBold, color: '#fff' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerTxt: { fontSize: Typography.size.sm },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base + 2,
    gap: Spacing.sm,
  },
  googleG: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleTxt: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium },

  toggleBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  toggleTxt: { fontSize: Typography.size.sm },
});
