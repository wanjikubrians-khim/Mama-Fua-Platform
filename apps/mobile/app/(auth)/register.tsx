'use client';
// Mama Fua Mobile — Register Screen
// KhimTech | 2026

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const BRAND = '#185fa5';

export default function RegisterScreen() {
  const { phone, otp } = useLocalSearchParams<{ phone: string; otp: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'CLEANER'>('CLIENT');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required', 'Please enter your first and last name.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        phone, otp,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        role,
        preferredLang: 'en',
      });
      const { accessToken, refreshToken, user } = res.data.data;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAuth(user, accessToken, refreshToken);
      router.replace(role === 'CLEANER' ? '/(cleaner)/dashboard' : '/(client)/dashboard');
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      Alert.alert('Registration failed', msg ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.logo}>Mama Fua</Text>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Phone: {phone}</Text>

      {/* Role selector */}
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'CLIENT' && styles.roleBtnActive]}
          onPress={() => setRole('CLIENT')}
        >
          <Text style={styles.roleEmoji}>🏠</Text>
          <Text style={[styles.roleLabel, role === 'CLIENT' && styles.roleLabelActive]}>I need a cleaner</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'CLEANER' && styles.roleBtnActive]}
          onPress={() => setRole('CLEANER')}
        >
          <Text style={styles.roleEmoji}>🧹</Text>
          <Text style={[styles.roleLabel, role === 'CLEANER' && styles.roleLabelActive]}>I am a cleaner</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Field label="First name" value={firstName} onChange={setFirstName} placeholder="Grace" />
        <Field label="Last name" value={lastName} onChange={setLastName} placeholder="Muthoni" />
        <Field label="Email (optional)" value={email} onChange={setEmail} placeholder="grace@email.com" keyboardType="email-address" />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitBtnText}>Create account →</Text>
        }
      </TouchableOpacity>

      <Text style={styles.terms}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </Text>
    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, paddingTop: 60 },
  logo: { fontSize: 28, fontWeight: '800', color: BRAND, textAlign: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 28 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  roleBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 18, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0',
  },
  roleBtnActive: { borderColor: BRAND, backgroundColor: '#eff6ff' },
  roleEmoji: { fontSize: 28, marginBottom: 6 },
  roleLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', textAlign: 'center' },
  roleLabelActive: { color: BRAND },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: BRAND, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 16,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  terms: { textAlign: 'center', fontSize: 12, color: '#94a3b8', lineHeight: 18 },
});
