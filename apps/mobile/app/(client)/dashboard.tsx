// Mama Fua Mobile — Client Dashboard
// KhimTech | 2026

import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES } from '@mama-fua/shared';
import { useAuthStore } from '@/store/auth.store';
import { bookingApi } from '@/lib/api';

const BRAND = '#185fa5';
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PENDING:     { bg: '#fef3c7', text: '#92400e' },
  ACCEPTED:    { bg: '#dbeafe', text: '#1e40af' },
  PAID:        { bg: '#dbeafe', text: '#1e40af' },
  IN_PROGRESS: { bg: '#d1fae5', text: '#065f46' },
  COMPLETED:   { bg: '#ede9fe', text: '#5b21b6' },
  CONFIRMED:   { bg: '#d1fae5', text: '#065f46' },
  CANCELLED:   { bg: '#f1f5f9', text: '#64748b' },
  DISPUTED:    { bg: '#fee2e2', text: '#991b1b' },
};

const SERVICES = [
  { label: 'Home cleaning', emoji: '🏠', serviceId: 'home' },
  { label: 'Laundry', emoji: '👕', serviceId: 'laundry' },
  { label: 'Office', emoji: '🏢', serviceId: 'office' },
  { label: 'Deep clean', emoji: '✨', serviceId: 'deep' },
];

interface Booking {
  id: string;
  bookingRef: string;
  status: string;
  scheduledAt: string;
  totalAmount: number;
  service: { name: string };
  cleaner: { firstName: string; lastName: string } | null;
  address: { area: string };
}

export default function ClientDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['bookings', 'client'],
    queryFn: () => bookingApi.list({ pageSize: 20 }),
  });

  const bookings: Booking[] = data?.data?.data ?? [];
  const active = bookings.filter((b) =>
    ['PENDING', 'ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(b.status)
  );
  const past = bookings.filter((b) =>
    ['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(b.status)
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BRAND} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}, {user?.firstName} 👋</Text>
          <Text style={styles.subGreeting}>What do you need today?</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/(client)/notifications')}
        >
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Quick book */}
      <Text style={styles.sectionTitle}>Book a service</Text>
      <View style={styles.servicesGrid}>
        {SERVICES.map((s) => (
          <TouchableOpacity
            key={s.serviceId}
            style={styles.serviceCard}
            onPress={() => router.push({ pathname: '/(client)/book', params: { serviceId: s.serviceId } })}
            activeOpacity={0.7}
          >
            <Text style={styles.serviceEmoji}>{s.emoji}</Text>
            <Text style={styles.serviceLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active bookings */}
      {active.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Active bookings</Text>
          {active.map((b) => (
            <BookingCard key={b.id} booking={b} onPress={() => router.push({ pathname: '/(client)/booking/[id]', params: { id: b.id } })} />
          ))}
        </>
      )}

      {/* Past bookings */}
      {past.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent bookings</Text>
          {past.slice(0, 5).map((b) => (
            <BookingCard key={b.id} booking={b} onPress={() => router.push({ pathname: '/(client)/booking/[id]', params: { id: b.id } })} />
          ))}
          {past.length > 5 && (
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/(client)/bookings')}>
              <Text style={styles.viewAllText}>View all bookings →</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {isLoading && <ActivityIndicator color={BRAND} style={{ marginTop: 32 }} />}

      {!isLoading && bookings.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🧹</Text>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyBody}>Book your first cleaner in under 2 minutes</Text>
          <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/(client)/book')}>
            <Text style={styles.bookBtnText}>Book a cleaner</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function BookingCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const statusStyle = STATUS_COLOR[booking.status] ?? { bg: '#f1f5f9', text: '#64748b' };
  return (
    <TouchableOpacity style={styles.bookingCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.bookingLeft}>
        <View style={styles.bookingIcon}>
          <Text style={{ fontSize: 22 }}>🧹</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookingService}>{booking.service.name}</Text>
          <Text style={styles.bookingMeta}>
            {booking.address.area} · {format(new Date(booking.scheduledAt), 'dd MMM, h:mm a')}
          </Text>
          {booking.cleaner && (
            <Text style={styles.bookingCleaner}>
              {booking.cleaner.firstName} {booking.cleaner.lastName}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.bookingRight}>
        <Text style={styles.bookingAmount}>{formatKES(booking.totalAmount)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {booking.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subGreeting: { fontSize: 14, color: '#64748b', marginTop: 2 },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#0f172a',
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 10,
  },
  serviceCard: {
    width: '46%', backgroundColor: '#fff', borderRadius: 16,
    padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    marginHorizontal: '2%',
  },
  serviceEmoji: { fontSize: 32, marginBottom: 8 },
  serviceLabel: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
  bookingCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  bookingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  bookingIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center',
  },
  bookingService: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  bookingMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  bookingCleaner: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  bookingRight: { alignItems: 'flex-end', gap: 6 },
  bookingAmount: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  viewAllBtn: { alignItems: 'center', paddingVertical: 14 },
  viewAllText: { fontSize: 14, color: BRAND, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 24 },
  bookBtn: { backgroundColor: BRAND, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  bookBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
