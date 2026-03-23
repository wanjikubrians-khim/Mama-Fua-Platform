'use client';
// Mama Fua — Booking Detail Page
// KhimTech | 2026

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatKES } from '@mama-fua/shared';
import { bookingApi, paymentsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { MapPin, Calendar, Clock, Star, AlertTriangle, MessageCircle, CheckCircle, ChevronRight, Loader2, Phone } from 'lucide-react';
import MpesaPayModal from '@/components/payment/MpesaPayModal';
import ChatPanel from '@/components/booking/ChatPanel';
import ReviewModal from '@/components/booking/ReviewModal';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  DRAFT:       { label: 'Draft',        color: 'text-gray-600',   bg: 'bg-gray-100',    desc: 'Booking not yet submitted' },
  PENDING:     { label: 'Finding cleaner', color: 'text-amber-700', bg: 'bg-amber-50',  desc: 'Searching for available cleaners in your area' },
  ACCEPTED:    { label: 'Cleaner assigned', color: 'text-blue-700',  bg: 'bg-blue-50',  desc: 'Your cleaner has accepted. Awaiting payment.' },
  PAID:        { label: 'Confirmed',    color: 'text-blue-700',   bg: 'bg-blue-50',     desc: 'Payment confirmed. Job scheduled.' },
  IN_PROGRESS: { label: 'In progress',  color: 'text-teal-700',   bg: 'bg-teal-50',     desc: 'Your cleaner has checked in and is working.' },
  COMPLETED:   { label: 'Completed',    color: 'text-purple-700', bg: 'bg-purple-50',   desc: 'Job done. Confirm to release payment.' },
  CONFIRMED:   { label: 'Confirmed ✓',  color: 'text-green-700',  bg: 'bg-green-50',    desc: 'Payment released. Thank you!' },
  DISPUTED:    { label: 'Disputed',     color: 'text-red-700',    bg: 'bg-red-50',      desc: 'Dispute under review by our team.' },
  CANCELLED:   { label: 'Cancelled',    color: 'text-gray-500',   bg: 'bg-gray-100',    desc: 'This booking was cancelled.' },
  REFUNDED:    { label: 'Refunded',     color: 'text-gray-500',   bg: 'bg-gray-100',    desc: 'Payment has been refunded.' },
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const isClient = user?.role === 'CLIENT';
  const isCleaner = user?.role === 'CLEANER';

  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeDesc, setDisputeDesc] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.get(id),
    refetchInterval: 15000, // poll every 15s for status updates
  });

  const booking = data?.data?.data;

  const mutation = useMutation({
    mutationFn: async (action: string) => {
      switch (action) {
        case 'accept':   return bookingApi.accept(id);
        case 'decline':  return bookingApi.decline(id);
        case 'start':    return bookingApi.start(id);
        case 'complete': return bookingApi.complete(id);
        case 'confirm':  return bookingApi.confirm(id);
        case 'cancel':   return bookingApi.cancel(id);
        default: throw new Error('Unknown action');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', id] }),
  });

  const raiseDispute = useMutation({
    mutationFn: () => bookingApi.dispute(id, { reason: 'POOR_QUALITY', description: disputeDesc }),
    onSuccess: () => { setShowDisputeForm(false); qc.invalidateQueries({ queryKey: ['booking', id] }); },
  });

  if (isLoading) return <LoadingState />;
  if (!booking) return <NotFound onBack={() => router.back()} />;

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG['PENDING']!;
  const canChat = ['ACCEPTED', 'PAID', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">← Back</button>
          <span className="text-sm font-semibold text-gray-500">{booking.bookingRef}</span>
          {canChat && (
            <button onClick={() => setShowChat(true)} className="relative p-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100">
              <MessageCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-6 space-y-4">

        {/* Status banner */}
        <div className={`rounded-2xl px-5 py-4 ${status.bg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-base font-bold ${status.color}`}>{status.label}</span>
            {booking.status === 'PENDING' && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-600">Searching...</span>
              </span>
            )}
          </div>
          <p className={`text-sm mt-0.5 ${status.color} opacity-75`}>{status.desc}</p>
        </div>

        {/* Service + people */}
        <div className="card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{booking.service?.name}</h2>
              <p className="text-2xl font-bold text-brand-600 mt-1">{formatKES(booking.totalAmount)}</p>
            </div>
            <span className="text-4xl">🧹</span>
          </div>

          {booking.cleaner && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700">
                  {booking.cleaner.firstName[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {booking.cleaner.firstName} {booking.cleaner.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Your cleaner</p>
                </div>
              </div>
              <a href={`tel:${booking.cleaner.phone}`} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50">
                <Phone className="h-4 w-4 text-gray-600" />
              </a>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="card space-y-3">
          <Row icon={<Calendar className="h-4 w-4 text-brand-600" />}
            label="Scheduled"
            value={format(new Date(booking.scheduledAt), "EEEE, dd MMM yyyy 'at' h:mm a")} />
          <Row icon={<MapPin className="h-4 w-4 text-brand-600" />}
            label="Location"
            value={`${booking.address?.addressLine1}, ${booking.address?.area}`} />
          {booking.specialInstructions && (
            <Row icon={<MessageCircle className="h-4 w-4 text-gray-400" />}
              label="Instructions"
              value={booking.specialInstructions} />
          )}
          {booking.actualStartAt && (
            <Row icon={<Clock className="h-4 w-4 text-teal-600" />}
              label="Started at"
              value={format(new Date(booking.actualStartAt), "h:mm a")} />
          )}
          {booking.actualEndAt && (
            <Row icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              label="Finished at"
              value={format(new Date(booking.actualEndAt), "h:mm a")} />
          )}
        </div>

        {/* Payment breakdown */}
        <div className="card space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payment</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service total</span>
            <span className="font-medium">{formatKES(booking.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Platform fee</span>
            <span className="text-gray-400">{formatKES(booking.platformFee)}</span>
          </div>
          {isCleaner && (
            <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
              <span className="font-semibold text-teal-700">Your earnings</span>
              <span className="font-bold text-teal-700">{formatKES(booking.cleanerEarnings)}</span>
            </div>
          )}
          {booking.payments?.[0] && (
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>M-Pesa ref</span>
              <span>{booking.payments[0].mpesaReceiptNumber ?? 'Pending'}</span>
            </div>
          )}
        </div>

        {/* ── CLIENT ACTIONS ── */}
        {isClient && (
          <div className="space-y-3">
            {/* Pay via M-Pesa (when accepted but not yet paid) */}
            {booking.status === 'ACCEPTED' && (
              <button onClick={() => setShowMpesaModal(true)} className="btn-primary w-full py-4 text-base">
                Pay {formatKES(booking.totalAmount)} via M-Pesa
              </button>
            )}

            {/* Confirm completion */}
            {booking.status === 'COMPLETED' && (
              <div className="card bg-teal-50 border border-teal-200">
                <p className="text-sm text-teal-800 font-medium mb-3">
                  Is the job done to your satisfaction?
                </p>
                <p className="text-xs text-teal-600 mb-4">
                  Confirming releases {formatKES(booking.cleanerEarnings)} to your cleaner's wallet. You have 24 hours before automatic release.
                </p>
                <button
                  onClick={() => mutation.mutate('confirm')}
                  disabled={mutation.isPending}
                  className="btn-primary w-full"
                >
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '✅ Yes, confirm & release payment'}
                </button>
              </div>
            )}

            {/* Rate and review */}
            {booking.status === 'CONFIRMED' && !booking.review && (
              <button onClick={() => setShowReview(true)} className="btn-secondary w-full">
                <Star className="h-4 w-4" /> Leave a review
              </button>
            )}

            {/* Raise dispute */}
            {booking.status === 'COMPLETED' && !showDisputeForm && (
              <button
                onClick={() => setShowDisputeForm(true)}
                className="btn-ghost w-full text-red-500 hover:bg-red-50"
              >
                <AlertTriangle className="h-4 w-4" /> Something went wrong — raise a dispute
              </button>
            )}
            {showDisputeForm && (
              <div className="card border border-red-200 bg-red-50 space-y-3">
                <p className="font-semibold text-red-800">Describe the issue</p>
                <textarea
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  rows={4}
                  className="input"
                  placeholder="Please describe what went wrong in detail. This helps our team resolve the issue quickly."
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowDisputeForm(false)} className="btn-ghost flex-1">Cancel</button>
                  <button
                    onClick={() => raiseDispute.mutate()}
                    disabled={disputeDesc.length < 20 || raiseDispute.isPending}
                    className="btn-primary flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-400"
                  >
                    {raiseDispute.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit dispute'}
                  </button>
                </div>
              </div>
            )}

            {/* Cancel */}
            {['PENDING', 'ACCEPTED'].includes(booking.status) && (
              <button
                onClick={() => mutation.mutate('cancel')}
                disabled={mutation.isPending}
                className="btn-ghost w-full text-gray-500"
              >
                Cancel booking
              </button>
            )}
          </div>
        )}

        {/* ── CLEANER ACTIONS ── */}
        {isCleaner && (
          <div className="space-y-3">
            {booking.status === 'PENDING' && booking.cleanerId === user?.id && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => mutation.mutate('decline')} disabled={mutation.isPending} className="btn-secondary">
                  Decline
                </button>
                <button onClick={() => mutation.mutate('accept')} disabled={mutation.isPending} className="btn-primary">
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept job'}
                </button>
              </div>
            )}
            {['ACCEPTED', 'PAID'].includes(booking.status) && (
              <button onClick={() => mutation.mutate('start')} disabled={mutation.isPending} className="btn-primary w-full py-4 text-base">
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '📍 Check in — start job'}
              </button>
            )}
            {booking.status === 'IN_PROGRESS' && (
              <button onClick={() => mutation.mutate('complete')} disabled={mutation.isPending} className="btn-primary w-full py-4 text-base bg-teal-600 hover:bg-teal-700 focus:ring-teal-400">
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '✅ Mark job complete'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showMpesaModal && (
        <MpesaPayModal
          bookingId={id}
          amount={booking.totalAmount}
          defaultPhone={user?.phone ?? ''}
          onClose={() => setShowMpesaModal(false)}
          onSuccess={() => { setShowMpesaModal(false); qc.invalidateQueries({ queryKey: ['booking', id] }); }}
        />
      )}
      {showChat && <ChatPanel bookingId={id} onClose={() => setShowChat(false)} />}
      {showReview && (
        <ReviewModal
          bookingId={id}
          cleanerName={`${booking.cleaner?.firstName} ${booking.cleaner?.lastName}`}
          onClose={() => setShowReview(false)}
          onSuccess={() => { setShowReview(false); qc.invalidateQueries({ queryKey: ['booking', id] }); }}
        />
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading booking...</p>
      </div>
    </div>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Booking not found</h2>
        <button onClick={onBack} className="btn-secondary mt-4">← Go back</button>
      </div>
    </div>
  );
}
