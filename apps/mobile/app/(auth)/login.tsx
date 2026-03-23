// Mama Fua Mobile — Login Screen
// KhimTech | 2026

import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { normalisePhone } from '@mama-fua/shared';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);

  const handleRequestOtp = async () => {
    const normalised = normalisePhone(phone);
    if (normalised.length < 12) {
      Alert.alert('Invalid number', 'Enter a valid Kenyan phone number.');
      return;
    }
    setLoading(true);
    try {
      await authApi.requestOtp(normalised);
      setPhone(normalised);
      setStep('otp');
      setTimeout(() => otpRef.current?.focus(), 300);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      Alert.alert('Error', msg ?? 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      const { isNewUser, accessToken, refreshToken, user } = res.data.data;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isNewUser) {
        router.push({ pathname: '/(auth)/register', params: { phone, otp } });
        return;
      }
      setAuth(user, accessToken, refreshToken);
      router.replace(user.role === 'CLEANER' ? '/(cleaner)/dashboard' : '/(client)/dashboard');
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      Alert.alert('Invalid code', msg ?? 'Check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <Text style={styles.logo}>Mama Fua</Text>
        <Text style={styles.tagline}>Trusted cleaners, near you</Text>

        <View style={styles.card}>
          {step === 'phone' ? (
            <>
              <Text style={styles.heading}>Enter your phone number</Text>
              <Text style={styles.subheading}>We'll send a 6-digit verification code</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+254 712 345 678"
                keyboardType="phone-pad"
                autoComplete="tel"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleRequestOtp}
              />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Send code</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkBtn}>
                <Text style={styles.linkText}>New here? Create account →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.heading}>Enter the code</Text>
              <Text style={styles.subheading}>Sent to {phone}</Text>
              <TextInput
                ref={otpRef}
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                returnKeyType="done"
                onSubmitEditing={handleVerifyOtp}
              />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Verify & log in</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setStep('phone'); setOtp(''); }}
                style={styles.linkBtn}
              >
                <Text style={styles.linkText}>← Change number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footer}>
          © 2026 KhimTech · Brian Wanjiku & Maryann Wanjiru
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const BRAND = '#185fa5';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontSize: 32, fontWeight: '800', color: BRAND, textAlign: 'center', marginBottom: 4 },
  tagline: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 24, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 8, elevation: 3,
  },
  heading: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: '#0f172a', backgroundColor: '#fff', marginBottom: 16,
  },
  otpInput: {
    textAlign: 'center', fontSize: 28, fontWeight: '700',
    letterSpacing: 12, color: BRAND,
  },
  btn: {
    backgroundColor: BRAND, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: BRAND, fontSize: 14, fontWeight: '500' },
  footer: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 32 },
});
