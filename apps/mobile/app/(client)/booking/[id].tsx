// Mama Fua Mobile — Booking Detail Screen
// KhimTech | 2026

import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { formatKES } from '@mama-fua/shared';
import { bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const BRAND = '#185fa5';
const TEAL = '#0f6e56';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const isClient = user?.role === 'CLIENT';
  const isCleaner = user?.role === 'CLEANER';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.get(id!),
    enabled: !!id,
  });

  const booking = data?.data?.data;

  const mutation = useMutation({
    mutationFn: async (action: string) => {
      switch (action) {
        case 'accept':   return bookingApi.accept(id!);
        case 'decline':  return bookingApi.decline(id!);
        case 'start':    return bookingApi.start(id!);
        case 'complete': return bookingApi.complete(id!);
        case 'confirm':  return bookingApi.confirm(id!);
        default: throw new Error('Unknown action');
      }
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      refetch();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      Alert.alert('Action failed', msg ?? 'Something went wrong. Try again.');
    },
  });

  const confirmAction = (action: string, title: string, message: string) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: action === 'decline' ? 'destructive' : 'default',
        onPress: () => mutation.mutate(action) },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={BRAND} size="large" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking {booking.bookingRef}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <View style={[styles.statusBanner, getStatusStyle(booking.status)]}>
          <Text style={styles.statusText}>{booking.status.replace(/_/g, ' ')}</Text>
        </View>

        {/* Service info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Service</Text>
          <Text style={styles.sectionValue}>{booking.service?.name}</Text>
          <Text style={styles.sectionSub}>{booking.service?.description}</Text>
        </View>

        {/* Date & location */}
        <View style={styles.section}>
          <Row label="📅 Scheduled" value={format(new Date(booking.scheduledAt), 'EEEE dd MMMM yyyy, h:mm a')} />
          <Row label="📍 Location" value={`${booking.address?.addressLine1}, ${booking.address?.area}`} />
          {booking.specialInstructions && (
            <Row label="📝 Instructions" value={booking.specialInstructions} />
          )}
        </View>

        {/* People */}
        <View style={styles.section}>
          {booking.cleaner && (
            <Row
              label={isClient ? '🧹 Cleaner' : '👤 Client'}
              value={isClient
                ? `${booking.cleaner.firstName} ${booking.cleaner.lastName}`
                : `${booking.client?.firstName} ${booking.client?.lastName}`}
            />
          )}
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Payment</Text>
          <Row label="Service total" value={formatKES(booking.totalAmount)} />
          <Row label="Platform fee" value={formatKES(booking.platformFee)} />
          {isCleaner && (
            <Row label="Your earnings" value={formatKES(booking.cleanerEarnings)} highlight />
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Client actions */}
          {isClient && booking.status === 'COMPLETED' && (
            <ActionButton label="✅ Confirm job done" color={TEAL}
              onPress={() => confirmAction('confirm', 'Confirm completion', 'This will release payment to the cleaner. Only confirm if the job is satisfactory.')} />
          )}
          {isClient && ['PENDING', 'ACCEPTED'].includes(booking.status) && (
            <ActionButton label="Cancel booking" color="#dc2626" outline
              onPress={() => confirmAction('cancel', 'Cancel booking', 'Are you sure you want to cancel? Cancellation fees may apply.')} />
          )}
          {isClient && booking.status === 'CONFIRMED' && (
            <ActionButton label="⭐ Leave a review" color={BRAND}
              onPress={() => router.push({ pathname: '/(client)/review', params: { bookingId: id } })} />
          )}

          {/* Cleaner actions */}
          {isCleaner && booking.status === 'PENDING' && (
            <View style={styles.rowButtons}>
              <ActionButton label="Decline" color="#dc2626" outline flex
                onPress={() => confirmAction('decline', 'Decline job', 'Are you sure you want to decline this job?')} />
              <ActionButton label="Accept job" color={BRAND} flex
                onPress={() => mutation.mutate('accept')} />
            </View>
          )}
          {isCleaner && ['ACCEPTED', 'PAID'].includes(booking.status) && (
            <ActionButton label="📍 Check in — start job" color={TEAL}
              onPress={() => confirmAction('start', 'Start job', 'Confirm you have arrived and are starting the job.')} />
          )}
          {isCleaner && booking.status === 'IN_PROGRESS' && (
            <ActionButton label="✅ Mark job complete" color={TEAL}
              onPress={() => confirmAction('complete', 'Complete job', 'Confirm the job is done. The client will be notified.')} />
          )}

          {/* Chat */}
          {['ACCEPTED', 'PAID', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
            <ActionButton label="💬 Open chat" color={BRAND} outline
              onPress={() => router.push({ pathname: '/(shared)/chat', params: { bookingId: id } })} />
          )}
        </View>

        {mutation.isPending && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={BRAND} size="large" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && { color: TEAL, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

function ActionButton({ label, color, outline, onPress, flex }: {
  label: string; color: string; outline?: boolean; onPress: () => void; flex?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        outline ? { backgroundColor: '#fff', borderWidth: 1.5, borderColor: color } : { backgroundColor: color },
        flex && { flex: 1 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.actionBtnText, outline && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getStatusStyle(status: string): { backgroundColor: string } {
  const map: Record<string, string> = {
    PENDING: '#fef3c7', ACCEPTED: '#dbeafe', PAID: '#dbeafe',
    IN_PROGRESS: '#d1fae5', COMPLETED: '#ede9fe', CONFIRMED: '#d1fae5',
    CANCELLED: '#f1f5f9', DISPUTED: '#fee2e2',
  };
  return { backgroundColor: map[status] ?? '#f1f5f9' };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#64748b', fontSize: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: BRAND },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  scroll: { flex: 1 },
  statusBanner: {
    marginHorizontal: 20, marginTop: 16, marginBottom: 4,
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
  },
  statusText: { fontSize: 14, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: {
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: 12,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  sectionValue: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  sectionSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6 },
  rowLabel: { fontSize: 13, color: '#64748b', flex: 1 },
  rowValue: { fontSize: 13, color: '#0f172a', fontWeight: '500', flex: 1.5, textAlign: 'right' },
  actions: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 10 },
  rowButtons: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
