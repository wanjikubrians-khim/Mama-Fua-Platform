// Mama Fua Mobile — Booking Flow
// KhimTech | 2026

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatKES } from '@mama-fua/shared';
import { bookingApi, api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const BRAND = '#185fa5';
const TEAL = '#0f6e56';

type Step = 0 | 1 | 2 | 3;

interface Draft {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  mode: 'AUTO_ASSIGN' | 'BROWSE_PICK' | 'POST_BID';
  bookingType: 'ONE_OFF' | 'RECURRING';
  scheduledDate: string;
  scheduledTime: string;
  addressLine: string;
  area: string;
  lat: number;
  lng: number;
  instructions: string;
  paymentMethod: 'MPESA' | 'WALLET' | 'CASH';
  mpesaPhone: string;
}

interface Service {
  id: string;
  name: string;
  basePrice: number;
  durationMinutes: number;
  category: string;
}

const SERVICE_EMOJI: Record<string, string> = {
  HOME_CLEANING: '🏠', LAUNDRY: '👕', OFFICE_CLEANING: '🏢',
  POST_CONSTRUCTION: '🔨', DEEP_CLEANING: '✨',
};

const STEP_TITLES = ['Choose service', 'Your location', 'Date & time', 'Review & pay'];

// Upcoming days helper
function getUpcomingDays(count = 14): Array<{ date: Date; label: string; dayLabel: string }> {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      date: d,
      label: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
      dayLabel: d.toLocaleDateString('en-KE', { weekday: 'short' }),
    };
  });
}

const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function BookingFlowScreen() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<Partial<Draft>>({
    mode: 'AUTO_ASSIGN',
    bookingType: 'ONE_OFF',
    paymentMethod: 'MPESA',
    mpesaPhone: user?.phone ?? '',
  });

  const update = (u: Partial<Draft>) => setDraft((d) => ({ ...d, ...u }));

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await api.get('/services')).data.data as Service[],
  });

  const createMutation = useMutation({
    mutationFn: () => bookingApi.create({
      serviceId: draft.serviceId,
      mode: draft.mode,
      bookingType: draft.bookingType,
      scheduledAt: `${draft.scheduledDate}T${draft.scheduledTime}:00+03:00`,
      address: {
        label: 'Job location',
        addressLine1: draft.addressLine ?? '',
        area: draft.area ?? '',
        lat: draft.lat ?? 0,
        lng: draft.lng ?? 0,
        instructions: draft.instructions,
      },
      paymentMethod: draft.paymentMethod,
      mpesaPhone: draft.mpesaPhone,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      router.replace({ pathname: '/(client)/booking/[id]', params: { id: res.data.data.id } });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      Alert.alert('Booking failed', msg ?? 'Something went wrong. Please try again.');
    },
  });

  const canProceed = [
    !!draft.serviceId,
    !!draft.addressLine && !!draft.area,
    !!draft.scheduledDate && !!draft.scheduledTime,
    true,
  ][step];

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 0 ? router.back() : setStep((s) => (s - 1) as Step)} style={styles.backBtn}>
          <Text style={styles.backText}>{step === 0 ? 'Cancel' : '← Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>{STEP_TITLES[step]}</Text>
        <Text style={styles.stepCount}>{step + 1}/4</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.progressBar, i <= step ? styles.progressActive : styles.progressInactive]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── STEP 0: SERVICE ── */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What do you need?</Text>
            <Text style={styles.stepSub}>Choose the service you need</Text>

            {servicesLoading ? (
              <ActivityIndicator color={BRAND} style={{ marginTop: 24 }} />
            ) : (
              <View style={styles.serviceGrid}>
                {(servicesData ?? []).map((svc) => {
                  const sel = draft.serviceId === svc.id;
                  return (
                    <TouchableOpacity
                      key={svc.id}
                      style={[styles.serviceCard, sel && styles.serviceCardSelected]}
                      onPress={() => update({ serviceId: svc.id, serviceName: svc.name, servicePrice: svc.basePrice })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.serviceEmoji}>{SERVICE_EMOJI[svc.category] ?? '🧹'}</Text>
                      <Text style={[styles.serviceName, sel && { color: BRAND }]}>{svc.name}</Text>
                      <Text style={styles.servicePrice}>From {formatKES(svc.basePrice)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {draft.serviceId && (
              <View style={styles.modeSection}>
                <Text style={styles.sectionTitle}>Booking mode</Text>
                {([
                  { v: 'AUTO_ASSIGN', l: '⚡ Auto-assign', d: 'Fastest — we find the best cleaner' },
                  { v: 'BROWSE_PICK', l: '🔍 Browse & pick', d: 'See available cleaners first' },
                  { v: 'POST_BID',   l: '💬 Post & bid',   d: 'Cleaners apply with their prices' },
                ] as const).map((m) => {
                  const sel = draft.mode === m.v;
                  return (
                    <TouchableOpacity
                      key={m.v}
                      style={[styles.modeCard, sel && styles.modeCardSelected]}
                      onPress={() => update({ mode: m.v })}
                    >
                      <Text style={[styles.modeLabel, sel && { color: BRAND }]}>{m.l}</Text>
                      <Text style={styles.modeDesc}>{m.d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── STEP 1: LOCATION ── */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Where do you need us?</Text>
            <Text style={styles.stepSub}>Enter the job address</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Street address / Estate</Text>
              <TextInput
                style={styles.input}
                value={draft.addressLine ?? ''}
                onChangeText={(v) => update({ addressLine: v })}
                placeholder="e.g. Lavington Green Apartments"
                autoCapitalize="words"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Area / Neighbourhood</Text>
              <TextInput
                style={styles.input}
                value={draft.area ?? ''}
                onChangeText={(v) => update({ area: v })}
                placeholder="e.g. Lavington, Westlands, Karen"
                autoCapitalize="words"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Access instructions <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={styles.input}
                value={draft.instructions ?? ''}
                onChangeText={(v) => update({ instructions: v })}
                placeholder="e.g. Gate code 1234, call on arrival"
              />
            </View>
          </View>
        )}

        {/* ── STEP 2: DATE & TIME ── */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>When do you need us?</Text>
            <Text style={styles.stepSub}>Pick a date and start time</Text>

            <Text style={styles.sectionTitle}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
              <View style={styles.daysRow}>
                {getUpcomingDays().map(({ date, label, dayLabel }) => {
                  const iso = date.toISOString().slice(0, 10);
                  const sel = draft.scheduledDate === iso;
                  return (
                    <TouchableOpacity
                      key={iso}
                      style={[styles.dayChip, sel && styles.dayChipSelected]}
                      onPress={() => update({ scheduledDate: iso })}
                    >
                      <Text style={[styles.dayChipDay, sel && { color: '#fff' }]}>{dayLabel}</Text>
                      <Text style={[styles.dayChipDate, sel && { color: '#fff' }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Start time</Text>
            <View style={styles.timesGrid}>
              {TIMES.map((t) => {
                const sel = draft.scheduledTime === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, sel && styles.timeChipSelected]}
                    onPress={() => update({ scheduledTime: t })}
                  >
                    <Text style={[styles.timeChipText, sel && { color: '#fff', fontWeight: '700' }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review your booking</Text>
            <Text style={styles.stepSub}>Confirm everything before paying</Text>

            <View style={styles.summaryCard}>
              <SummaryRow label="Service" value={draft.serviceName ?? ''} />
              <SummaryRow label="Location" value={`${draft.addressLine}, ${draft.area}`} />
              <SummaryRow label="Date" value={draft.scheduledDate ?? ''} />
              <SummaryRow label="Time" value={draft.scheduledTime ?? ''} />
              <SummaryRow label="Mode" value={draft.mode?.replace('_', ' ') ?? ''} />
              <View style={styles.divider} />
              <SummaryRow label="Total" value={formatKES(draft.servicePrice ?? 0)} highlight />
            </View>

            <Text style={styles.sectionTitle}>Payment method</Text>
            {(['MPESA', 'WALLET', 'CASH'] as const).map((m) => {
              const labels = { MPESA: '📱 M-Pesa', WALLET: '💰 Wallet', CASH: '💵 Cash' };
              const sel = draft.paymentMethod === m;
              return (
                <TouchableOpacity key={m} style={[styles.payCard, sel && styles.payCardSelected]} onPress={() => update({ paymentMethod: m })}>
                  <Text style={[styles.payLabel, sel && { color: BRAND }]}>{labels[m]}</Text>
                  {sel && <Text style={styles.payCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            {draft.paymentMethod === 'MPESA' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>M-Pesa phone number</Text>
                <TextInput
                  style={styles.input}
                  value={draft.mpesaPhone ?? ''}
                  onChangeText={(v) => update({ mpesaPhone: v })}
                  keyboardType="phone-pad"
                  placeholder="+254 712 345 678"
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          disabled={!canProceed || createMutation.isPending}
          onPress={() => {
            if (step < 3) setStep((s) => (s + 1) as Step);
            else createMutation.mutate();
          }}
          activeOpacity={0.85}
        >
          {createMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.nextBtnText}>
                {step < 3 ? 'Continue →' : `Confirm & pay ${formatKES(draft.servicePrice ?? 0)}`}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && { color: BRAND, fontWeight: '800', fontSize: 17 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  stepLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  stepCount: { fontSize: 13, color: '#94a3b8' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#fff' },
  progressBar: { flex: 1, height: 3, borderRadius: 2 },
  progressActive: { backgroundColor: BRAND },
  progressInactive: { backgroundColor: '#e2e8f0' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  stepContainer: { padding: 20 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  stepSub: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  serviceCardSelected: { borderColor: BRAND, backgroundColor: '#eff6ff' },
  serviceEmoji: { fontSize: 28, marginBottom: 8 },
  serviceName: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  servicePrice: { fontSize: 12, color: '#64748b' },
  modeSection: { marginTop: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  modeCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 2, borderColor: '#e2e8f0',
  },
  modeCardSelected: { borderColor: BRAND, backgroundColor: '#eff6ff' },
  modeLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  modeDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  optional: { fontWeight: '400', color: '#94a3b8' },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a',
  },
  daysRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 4 },
  dayChip: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', minWidth: 60,
  },
  dayChipSelected: { backgroundColor: BRAND, borderColor: BRAND },
  dayChipDay: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  dayChipDate: { fontSize: 13, color: '#0f172a', fontWeight: '700', marginTop: 2 },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  timeChipSelected: { backgroundColor: BRAND, borderColor: BRAND },
  timeChipText: { fontSize: 14, color: '#374151' },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryValue: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 6 },
  payCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 2, borderColor: '#e2e8f0',
  },
  payCardSelected: { borderColor: BRAND, backgroundColor: '#eff6ff' },
  payLabel: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  payCheck: { fontSize: 16, color: BRAND, fontWeight: '800' },
  footer: {
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
  },
  nextBtn: {
    backgroundColor: BRAND, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
