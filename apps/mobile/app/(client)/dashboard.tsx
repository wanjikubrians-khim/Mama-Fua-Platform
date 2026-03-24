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
import { Colors, getStatusStyle, Typography, Spacing, CommonStyles, Radius, Shadows } from '@/theme';

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
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.brand[600]} />}
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

      {isLoading && <ActivityIndicator color={Colors.brand[600]} style={{ marginTop: 32 }} />}

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
  const statusStyle = getStatusStyle(booking.status);
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
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing[10] },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing[5], paddingTop: 60, paddingBottom: Spacing[5], backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  greeting: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  subGreeting: { fontSize: Typography.size.base, color: Colors.textSecondary, marginTop: Spacing[1] },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.gray[100], alignItems: 'center', justifyContent: 'center',
  },
  notifIcon: { fontSize: Typography.size.lg },
  sectionTitle: {
    fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary,
    marginHorizontal: Spacing[5], marginTop: Spacing[6], marginBottom: Spacing[3],
  },
  servicesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing[3], gap: Spacing[3],
  },
  serviceCard: {
    width: '46%', backgroundColor: Colors.backgroundCard, borderRadius: Radius.lg,
    padding: Spacing[5], alignItems: 'center',
    ...Shadows.card,
    marginHorizontal: '2%',
  },
  serviceEmoji: { fontSize: Typography.size['3xl'], marginBottom: Spacing[2] },
  serviceLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textSecondary, textAlign: 'center' },
  bookingCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.backgroundCard, marginHorizontal: Spacing[5], marginBottom: Spacing[3],
    borderRadius: Radius.lg, padding: Spacing[4],
    ...Shadows.card,
  },
  bookingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing[3] },
  bookingIcon: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.brand[50], alignItems: 'center', justifyContent: 'center',
  },
  bookingService: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  bookingMeta: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: Spacing[1] },
  bookingCleaner: { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: Spacing[1] },
  bookingRight: { alignItems: 'flex-end', gap: Spacing[2] },
  bookingAmount: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  statusText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  viewAllBtn: { alignItems: 'center', paddingVertical: Spacing[4] },
  viewAllText: { fontSize: Typography.size.base, color: Colors.brand[600], fontWeight: Typography.weight.semibold },
  emptyState: { alignItems: 'center', paddingVertical: Spacing[12], paddingHorizontal: Spacing[8] },
  emptyEmoji: { fontSize: Typography.size['4xl'], marginBottom: Spacing[4] },
  emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  emptyBody: { fontSize: Typography.size.base, color: Colors.textTertiary, textAlign: 'center', marginBottom: Spacing[6] },
  bookBtn: { backgroundColor: Colors.brand[600], borderRadius: Radius.md, paddingHorizontal: Spacing[8], paddingVertical: Spacing[4] },
  bookBtnText: { color: Colors.textInverse, fontWeight: Typography.weight.semibold, fontSize: Typography.size.md },
});
