'use client';
// Mama Fua — Booking Detail Page
// KhimTech | 2026

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES } from '@mama-fua/shared';
import { bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  MapPin,
  Calendar,
  Clock,
  Star,
  AlertTriangle,
  MessageCircle,
  CheckCircle,
  Loader2,
  Phone,
} from 'lucide-react';
import MpesaPayModal from '@/components/payment/MpesaPayModal';
import ChatPanel from '@/components/booking/ChatPanel';
import ReviewModal from '@/components/booking/ReviewModal';
import TrackingPanel from '@/components/booking/TrackingPanel';

const STATUS_CONFIG: Record<string, { label: string; tone: string; desc: string }> = {
  DRAFT: {
    label: 'Draft',
    tone: 'border-gray-200 bg-white text-ink-700',
    desc: 'Booking not yet submitted.',
  },
  PENDING: {
    label: 'Finding cleaner',
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
    desc: 'Searching for available cleaners in your area.',
  },
  ACCEPTED: {
    label: 'Cleaner assigned',
    tone: 'border-brand-200 bg-brand-50 text-brand-800',
    desc: 'Your cleaner has accepted. Payment is the next step.',
  },
  PAID: {
    label: 'Confirmed',
    tone: 'border-brand-200 bg-brand-50 text-brand-800',
    desc: 'Payment confirmed. The job is scheduled.',
  },
  IN_PROGRESS: {
    label: 'In progress',
    tone: 'border-mint-200 bg-mint-50 text-mint-800',
    desc: 'Your cleaner has checked in and is working.',
  },
  COMPLETED: {
    label: 'Completed',
    tone: 'border-mint-200 bg-gradient-to-br from-white to-mint-50 text-mint-800',
    desc: 'Job done. Confirm to release payment.',
  },
  CONFIRMED: {
    label: 'Confirmed',
    tone: 'border-mint-200 bg-gradient-to-br from-white to-mint-50 text-mint-800',
    desc: 'Payment released. Thank you for booking with Mama Fua.',
  },
  DISPUTED: {
    label: 'Disputed',
    tone: 'border-red-200 bg-red-50 text-red-700',
    desc: 'A dispute is under review by our team.',
  },
  CANCELLED: {
    label: 'Cancelled',
    tone: 'border-gray-200 bg-gray-50 text-gray-600',
    desc: 'This booking was cancelled.',
  },
  REFUNDED: {
    label: 'Refunded',
    tone: 'border-gray-200 bg-gray-50 text-gray-600',
    desc: 'Payment has been refunded.',
  },
};

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<BookingDetailPageFallback />}>
      <BookingDetailPageContent />
    </Suspense>
  );
}

function BookingDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const isClient = user?.role === 'CLIENT';
  const isCleaner = user?.role === 'CLEANER';
  const requestedPanel = searchParams.get('panel');

  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeDesc, setDisputeDesc] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.get(id),
    refetchInterval: 15000,
  });

  const booking = data?.data?.data;

  useEffect(() => {
    if (!booking) return;

    if (requestedPanel === 'chat') setShowChat(true);
    if (requestedPanel === 'review' && booking.status === 'CONFIRMED' && !booking.review) {
      setShowReview(true);
    }
  }, [booking, requestedPanel]);

  const mutation = useMutation({
    mutationFn: async (action: string) => {
      switch (action) {
        case 'accept':
          return bookingApi.accept(id);
        case 'decline':
          return bookingApi.decline(id);
        case 'start':
          return bookingApi.start(id);
        case 'complete':
          return bookingApi.complete(id);
        case 'confirm':
          return bookingApi.confirm(id);
        case 'cancel':
          return bookingApi.cancel(id);
        default:
          throw new Error('Unknown action');
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booking', id] }),
  });

  const raiseDispute = useMutation({
    mutationFn: () => bookingApi.dispute(id, { reason: 'POOR_QUALITY', description: disputeDesc }),
    onSuccess: () => {
      setShowDisputeForm(false);
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
  });

  if (isLoading) return <LoadingState />;
  if (!booking) return <NotFound onBack={() => router.back()} />;

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING!;
  const canChat = ['ACCEPTED', 'PAID', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);
  const showTracking = [
    'PENDING',
    'ACCEPTED',
    'PAID',
    'IN_PROGRESS',
    'COMPLETED',
    'CONFIRMED',
  ].includes(booking.status);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="section-shell shine-panel px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => router.back()} className="btn-ghost px-4 py-2.5 text-sm">
              ← Back
            </button>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
                Booking reference
              </p>
              <p className="mt-1 text-sm font-semibold text-ink-900">{booking.bookingRef}</p>
            </div>
            {canChat ? (
              <button
                onClick={() => setShowChat(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700 shadow-soft transition-colors hover:bg-brand-100"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            ) : (
              <div className="h-11 w-11" />
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className={`rounded-[1.8rem] border px-5 py-5 shadow-soft ${status.tone}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">
                    Status
                  </p>
                  <h1 className="mt-2 text-3xl">{status.label}</h1>
                </div>
                {booking.status === 'PENDING' && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold shadow-soft">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Searching
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 opacity-80">{status.desc}</p>
            </div>

            <section className="section-shell shine-panel px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
                    Booking summary
                  </p>
                  <h2 className="mt-3 text-4xl text-ink-900">{booking.service?.name}</h2>
                  <p className="mt-3 text-2xl font-semibold text-brand-700">
                    {formatKES(booking.totalAmount)}
                  </p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-brand-50 to-mint-50 text-3xl">
                  🧹
                </div>
              </div>
            </section>

            <section className="section-shell shine-panel px-6 py-6">
              <h2 className="text-3xl text-ink-900">Details</h2>
              <div className="mt-5 space-y-4">
                <Row
                  icon={<Calendar className="h-4 w-4 text-brand-600" />}
                  label="Scheduled"
                  value={format(new Date(booking.scheduledAt), "EEEE, dd MMM yyyy 'at' h:mm a")}
                />
                <Row
                  icon={<MapPin className="h-4 w-4 text-brand-600" />}
                  label="Location"
                  value={`${booking.address?.addressLine1}, ${booking.address?.area}`}
                />
                {booking.specialInstructions && (
                  <Row
                    icon={<MessageCircle className="h-4 w-4 text-ink-400" />}
                    label="Instructions"
                    value={booking.specialInstructions}
                  />
                )}
                {booking.actualStartAt && (
                  <Row
                    icon={<Clock className="h-4 w-4 text-mint-700" />}
                    label="Started at"
                    value={format(new Date(booking.actualStartAt), 'h:mm a')}
                  />
                )}
                {booking.actualEndAt && (
                  <Row
                    icon={<CheckCircle className="h-4 w-4 text-mint-700" />}
                    label="Finished at"
                    value={format(new Date(booking.actualEndAt), 'h:mm a')}
                  />
                )}
              </div>
            </section>

            {isClient && (
              <section className="section-shell shine-panel px-6 py-6">
                <h2 className="text-3xl text-ink-900">Actions</h2>
                <div className="mt-5 space-y-4">
                  {booking.status === 'ACCEPTED' && (
                    <button
                      onClick={() => setShowMpesaModal(true)}
                      className="btn-primary w-full py-4 text-base"
                    >
                      Pay {formatKES(booking.totalAmount)} via M-Pesa
                    </button>
                  )}

                  {booking.status === 'COMPLETED' && (
                    <div className="card-muted shine-panel p-5">
                      <p className="text-sm font-semibold text-ink-900">
                        Is the job done to your satisfaction?
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        Confirming releases {formatKES(booking.cleanerEarnings)} to your
                        cleaner&apos;s wallet. Automatic release happens after 24 hours.
                      </p>
                      <button
                        onClick={() => mutation.mutate('confirm')}
                        disabled={mutation.isPending}
                        className="btn-primary mt-5 w-full"
                      >
                        {mutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Confirm & release payment'
                        )}
                      </button>
                    </div>
                  )}

                  {booking.status === 'CONFIRMED' && !booking.review && (
                    <button onClick={() => setShowReview(true)} className="btn-secondary w-full">
                      <Star className="h-4 w-4" /> Leave a review
                    </button>
                  )}

                  {booking.status === 'COMPLETED' && !showDisputeForm && (
                    <button
                      onClick={() => setShowDisputeForm(true)}
                      className="btn-ghost w-full justify-start rounded-[1.5rem] border border-red-100 bg-red-50/70 px-4 py-4 text-red-600 hover:bg-red-50"
                    >
                      <AlertTriangle className="h-4 w-4" /> Something went wrong. Raise a dispute.
                    </button>
                  )}

                  {showDisputeForm && (
                    <div className="rounded-[1.6rem] border border-red-200 bg-red-50 px-4 py-4">
                      <p className="font-semibold text-red-800">Describe the issue</p>
                      <textarea
                        value={disputeDesc}
                        onChange={(event) => setDisputeDesc(event.target.value)}
                        rows={4}
                        className="input mt-3 resize-none"
                        placeholder="Please describe what went wrong in detail."
                      />
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() => setShowDisputeForm(false)}
                          className="btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => raiseDispute.mutate()}
                          disabled={disputeDesc.length < 20 || raiseDispute.isPending}
                          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {raiseDispute.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Submit dispute'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {['PENDING', 'ACCEPTED'].includes(booking.status) && (
                    <button
                      onClick={() => mutation.mutate('cancel')}
                      disabled={mutation.isPending}
                      className="btn-ghost w-full justify-start rounded-[1.5rem] border border-white/90 bg-white/70 px-4 py-4 text-ink-500"
                    >
                      Cancel booking
                    </button>
                  )}
                </div>
              </section>
            )}

            {isCleaner && (
              <section className="section-shell shine-panel px-6 py-6">
                <h2 className="text-3xl text-ink-900">Cleaner actions</h2>
                <div className="mt-5 space-y-4">
                  {booking.status === 'PENDING' && booking.cleanerId === user?.id && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => mutation.mutate('decline')}
                        disabled={mutation.isPending}
                        className="btn-secondary"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => mutation.mutate('accept')}
                        disabled={mutation.isPending}
                        className="btn-primary"
                      >
                        {mutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Accept job'
                        )}
                      </button>
                    </div>
                  )}

                  {['ACCEPTED', 'PAID'].includes(booking.status) && (
                    <button
                      onClick={() => mutation.mutate('start')}
                      disabled={mutation.isPending}
                      className="btn-primary w-full py-4 text-base"
                    >
                      {mutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Check in and start job'
                      )}
                    </button>
                  )}

                  {booking.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => mutation.mutate('complete')}
                      disabled={mutation.isPending}
                      className="w-full rounded-2xl bg-mint-600 px-5 py-4 text-base font-semibold text-white shadow-glow transition-colors hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {mutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mark job complete'
                      )}
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            {booking.cleaner ? (
              <div className="dark-panel shine-panel px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
                  Assigned cleaner
                </p>
                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white">
                    {booking.cleaner.firstName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-semibold text-white">
                      {booking.cleaner.firstName} {booking.cleaner.lastName}
                    </p>
                    <p className="mt-1 text-sm text-white/70">Your cleaner</p>
                  </div>
                  <a
                    href={`tel:${booking.cleaner.phone}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-900 shadow-soft transition-colors hover:bg-brand-50"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
                <p className="mt-5 text-sm leading-6 text-white/70">
                  Use chat or phone if you need to coordinate arrival details or building access.
                </p>
              </div>
            ) : (
              <div className="dark-panel shine-panel px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
                  Live updates
                </p>
                <h2 className="mt-4 text-3xl text-white">We’ll keep this page in sync.</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Booking status refreshes automatically so you can follow matching, payment, and
                  completion without reloading.
                </p>
              </div>
            )}

            {showTracking && (
              <TrackingPanel
                bookingId={booking.id}
                bookingStatus={booking.status}
                role={user?.role}
                cleaner={booking.cleaner}
                address={booking.address}
              />
            )}

            <section className="section-shell shine-panel px-6 py-6">
              <h2 className="text-3xl text-ink-900">Payment</h2>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Service total</span>
                  <span className="font-semibold text-ink-900">
                    {formatKES(booking.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Platform fee</span>
                  <span className="text-ink-700">{formatKES(booking.platformFee)}</span>
                </div>
                {isCleaner && (
                  <div className="flex justify-between rounded-2xl bg-mint-50 px-4 py-3 text-sm">
                    <span className="font-semibold text-mint-800">Your earnings</span>
                    <span className="font-semibold text-mint-800">
                      {formatKES(booking.cleanerEarnings)}
                    </span>
                  </div>
                )}
                {booking.payments?.[0] && (
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                      M-Pesa ref
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink-900">
                      {booking.payments[0].mpesaReceiptNumber ?? 'Pending'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showMpesaModal && (
        <MpesaPayModal
          bookingId={id}
          amount={booking.totalAmount}
          defaultPhone={user?.phone ?? ''}
          onClose={() => setShowMpesaModal(false)}
          onSuccess={() => {
            setShowMpesaModal(false);
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
          }}
        />
      )}
      {showChat && <ChatPanel bookingId={id} onClose={() => setShowChat(false)} />}
      {showReview && (
        <ReviewModal
          bookingId={id}
          cleanerName={`${booking.cleaner?.firstName} ${booking.cleaner?.lastName}`}
          onClose={() => setShowReview(false)}
          onSuccess={() => {
            setShowReview(false);
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
          }}
        />
      )}
    </div>
  );
}

function BookingDetailPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="section-shell shine-panel px-10 py-10 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-4 text-sm text-ink-500">Loading booking details...</p>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[1.5rem] border border-white/90 bg-white/74 px-4 py-4 shadow-soft">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-ink-800">{value}</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="section-shell shine-panel px-10 py-10 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-4 text-sm text-ink-500">Loading booking...</p>
      </div>
    </div>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="section-shell shine-panel px-10 py-10 text-center">
        <p className="text-5xl">🔍</p>
        <h2 className="mt-4 text-4xl text-ink-900">Booking not found</h2>
        <button onClick={onBack} className="btn-secondary mt-6">
          Go back
        </button>
      </div>
    </div>
  );
}
