// Mama Fua Mobile — Cleaner Dashboard
// KhimTech | 2026

import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES } from '@mama-fua/shared';
import { useAuthStore } from '@/store/auth.store';
import { bookingApi, cleanerApi } from '@/lib/api';

const BRAND = '#185fa5';
const TEAL = '#0f6e56';

interface Booking {
  id: string;
  bookingRef: string;
  status: string;
  scheduledAt: string;
  totalAmount: number;
  cleanerEarnings: number;
  service: { name: string };
  client: { firstName: string; lastName: string };
  address: { area: string; city: string };
}

export default function CleanerDashboard() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['cleaner-profile'],
    queryFn: () => cleanerApi.me(),
  });

  const { data: bookingsData, isLoading: bookingsLoading, refetch, isRefetching } = useQuery({
    queryKey: ['bookings', 'cleaner'],
    queryFn: () => bookingApi.list({ pageSize: 20 }),
  });

  const { data: walletData } = useQuery({
    queryKey: ['cleaner-wallet'],
    queryFn: () => cleanerApi.wallet(),
  });

  const toggleAvailable = useMutation({
    mutationFn: (val: boolean) => cleanerApi.setAvailable(val),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cleaner-profile'] }),
  });

  const profile = profileData?.data?.data;
  const bookings: Booking[] = bookingsData?.data?.data ?? [];
  const wallet = walletData?.data?.data;

  const pending = bookings.filter((b) => b.status === 'PENDING');
  const active = bookings.filter((b) => ['ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(b.status));
  const recent = bookings.filter((b) => ['CONFIRMED', 'COMPLETED'].includes(b.status));

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
          <Text style={styles.greeting}>Hey, {user?.firstName} 👋</Text>
          <Text style={styles.subGreeting}>Here's your job overview</Text>
        </View>
        <View style={styles.availRow}>
          <Text style={styles.availLabel}>
            {profile?.isAvailable ? 'Available' : 'Offline'}
          </Text>
          <Switch
            value={profile?.isAvailable ?? false}
            onValueChange={(v) => toggleAvailable.mutate(v)}
            trackColor={{ false: '#e2e8f0', true: '#d1fae5' }}
            thumbColor={profile?.isAvailable ? TEAL : '#94a3b8'}
          />
        </View>
      </View>

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {wallet ? formatKES(wallet.balance) : '—'}
          </Text>
          <Text style={styles.statLabel}>Wallet balance</Text>
          <TouchableOpacity onPress={() => router.push('/(cleaner)/wallet')} style={styles.statLink}>
            <Text style={styles.statLinkText}>Withdraw →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>⭐ {profile?.rating ?? '—'}</Text>
          <Text style={styles.statLabel}>Your rating</Text>
          <Text style={styles.statSub}>{profile?.totalJobs ?? 0} jobs done</Text>
        </View>
      </View>

      {/* Pending job offers */}
      {pending.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New job offers</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pending.length}</Text>
            </View>
          </View>
          {pending.map((b) => (
            <JobOfferCard key={b.id} booking={b}
              onAccept={() => bookingApi.accept(b.id).then(() => refetch())}
              onDecline={() => bookingApi.decline(b.id).then(() => refetch())}
              onView={() => router.push({ pathname: '/(cleaner)/booking/[id]', params: { id: b.id } })}
            />
          ))}
        </>
      )}

      {/* Active jobs */}
      {active.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Active jobs</Text>
          {active.map((b) => (
            <CleanerBookingCard key={b.id} booking={b}
              onPress={() => router.push({ pathname: '/(cleaner)/booking/[id]', params: { id: b.id } })}
            />
          ))}
        </>
      )}

      {/* Recent completed */}
      {recent.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recently completed</Text>
          {recent.slice(0, 3).map((b) => (
            <CleanerBookingCard key={b.id} booking={b}
              onPress={() => router.push({ pathname: '/(cleaner)/booking/[id]', params: { id: b.id } })}
            />
          ))}
        </>
      )}

      {(bookingsLoading || profileLoading) && (
        <ActivityIndicator color={BRAND} style={{ marginTop: 32 }} />
      )}

      {!bookingsLoading && bookings.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No jobs yet</Text>
          <Text style={styles.emptyBody}>
            Make sure you're marked as available and have your service area set up.
          </Text>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(cleaner)/profile')}>
            <Text style={styles.profileBtnText}>Update my profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function JobOfferCard({ booking, onAccept, onDecline, onView }: {
  booking: Booking;
  onAccept: () => void;
  onDecline: () => void;
  onView: () => void;
}) {
  return (
    <TouchableOpacity style={styles.offerCard} onPress={onView} activeOpacity={0.85}>
      <View style={styles.offerTop}>
        <Text style={styles.offerService}>{booking.service.name}</Text>
        <Text style={styles.offerEarnings}>{formatKES(booking.cleanerEarnings)}</Text>
      </View>
      <Text style={styles.offerMeta}>
        📍 {booking.address.area} · {format(new Date(booking.scheduledAt), 'EEE dd MMM, h:mm a')}
      </Text>
      <Text style={styles.offerClient}>
        Client: {booking.client.firstName} {booking.client.lastName}
      </Text>
      <View style={styles.offerActions}>
        <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
          <Text style={styles.acceptBtnText}>Accept job</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function CleanerBookingCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.bookingCard} onPress={onPress} activeOpacity={0.75}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bookingService}>{booking.service.name}</Text>
        <Text style={styles.bookingMeta}>
          {booking.address.area} · {format(new Date(booking.scheduledAt), 'dd MMM, h:mm a')}
        </Text>
        <Text style={styles.bookingClient}>
          {booking.client.firstName} {booking.client.lastName}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.bookingEarnings}>{formatKES(booking.cleanerEarnings)}</Text>
        <Text style={styles.bookingStatus}>{booking.status.replace('_', ' ')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subGreeting: { fontSize: 13, color: '#64748b', marginTop: 2 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  statsRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingTop: 20,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748b' },
  statSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statLink: { marginTop: 8 },
  statLinkText: { fontSize: 13, color: BRAND, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#0f172a',
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  badge: {
    backgroundColor: '#fee2e2', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#dc2626' },
  offerCard: {
    backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 12,
    borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: BRAND + '30',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  offerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  offerService: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  offerEarnings: { fontSize: 18, fontWeight: '800', color: TEAL },
  offerMeta: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  offerClient: { fontSize: 12, color: '#94a3b8', marginBottom: 14 },
  offerActions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  declineBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  acceptBtn: {
    flex: 2, backgroundColor: BRAND,
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  acceptBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  bookingCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  bookingService: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  bookingMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  bookingClient: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  bookingEarnings: { fontSize: 15, fontWeight: '700', color: TEAL },
  bookingStatus: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 24 },
  profileBtn: { backgroundColor: BRAND, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },
  profileBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
