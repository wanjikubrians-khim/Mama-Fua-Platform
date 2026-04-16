'use client';
// Mama Fua — Cleaner Wallet
// KhimTech | 2026

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PAYMENT, formatKES } from '@mama-fua/shared';
import {
  AlertCircle, ArrowRight, ArrowUpRight, BadgeInfo,
  CheckCircle2, CreditCard, Loader2, Phone,
  ShieldCheck, TrendingUp, Wallet,
} from 'lucide-react';
import { cleanerApi, paymentsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface CleanerProfile {
  mpesaPhone: string | null;
  verificationStatus: string;
  user: { phone: string; firstName: string };
}

interface WalletTx {
  id: string;
  amount: number;
  balanceAfter: number;
  bookingId: string | null;
  createdAt: string;
  description: string;
  type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE';
}

interface WalletPayload { balance: number; transactions: WalletTx[] }

const TX_STYLES: Record<WalletTx['type'], string> = {
  CREDIT:  'bg-mint-50  text-mint-700',
  DEBIT:   'bg-red-50   text-red-700',
  HOLD:    'bg-amber-50 text-amber-700',
  RELEASE: 'bg-brand-50 text-brand-700',
};

export default function CleanerWalletPage() {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [amountKes, setAmountKes] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');

  const { data: profileRes } = useQuery({
    queryKey: ['cleaner-profile'],
    queryFn:  () => cleanerApi.me(),
    enabled:  user?.role === 'CLEANER',
  });

  const { data: walletRes, isLoading: walletLoading } = useQuery({
    queryKey: ['cleaner-wallet'],
    queryFn:  () => cleanerApi.wallet(),
    enabled:  user?.role === 'CLEANER',
  });

  const requestPayout = useMutation({
    mutationFn: (payload: { amount: number; mpesaPhone: string }) =>
      paymentsApi.payoutRequest({ amount: payload.amount, method: 'MPESA', mpesaPhone: payload.mpesaPhone }),
    onSuccess: () => {
      setAmountKes('');
      queryClient.invalidateQueries({ queryKey: ['cleaner-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['cleaner-profile'] });
    },
  });

  useEffect(() => {
    const p: CleanerProfile | null = profileRes?.data?.data ?? null;
    if (!mpesaPhone && p) setMpesaPhone(p.mpesaPhone || p.user.phone || '');
  }, [mpesaPhone, profileRes]);

  if (!user) return <AccessGate title="Sign in required" body="Log in with your cleaner account to access your wallet." href="/login" cta="Go to login" />;
  if (user.role !== 'CLEANER') return <AccessGate title="Cleaner wallet only" body="This payout screen is only available to cleaner accounts." href="/dashboard" cta="Open dashboard" />;

  const profile: CleanerProfile | null = profileRes?.data?.data ?? null;
  const wallet: WalletPayload | null   = walletRes?.data?.data ?? null;
  const balance     = wallet?.balance ?? 0;
  const amountCents = Math.round((Number(amountKes) || 0) * 100);
  const canWithdraw = !!mpesaPhone && amountCents >= PAYMENT.MIN_WITHDRAWAL && amountCents <= balance && !requestPayout.isPending;

  const errorMsg   = (requestPayout.error as Error & { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? requestPayout.error?.message;
  const successMsg = requestPayout.data?.data?.data?.message as string | undefined;

  // Stats for header
  const totalEarned  = wallet?.transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0) ?? 0;
  const totalWithdrawn = wallet?.transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0) ?? 0;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">

        {/* ── HEADER ──────────────────────────────────────────── */}
        <header className="rounded-3xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="bg-ink-900 px-6 pt-7 pb-8 sm:px-8 sm:pt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Cleaner wallet</p>
            <h1 className="mt-1.5 text-3xl font-extrabold text-white sm:text-4xl">
              Your earnings
            </h1>
            <p className="mt-1.5 text-sm text-white/50">
              Released earnings land here. Withdraw to M-Pesa anytime.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Available</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">{formatKES(balance)}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Total earned</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">{formatKES(totalEarned)}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-xs text-white/40 uppercase tracking-wide">Withdrawn</p>
                <p className="mt-1.5 text-xl font-extrabold text-white">{formatKES(totalWithdrawn)}</p>
              </div>
            </div>
          </div>

          {/* Payout info strip */}
          <div className="bg-white px-6 py-4 sm:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-ink-600">
              <Phone className="h-4 w-4 text-brand-600 flex-shrink-0" />
              <span className="font-semibold text-ink-800">
                {profile?.mpesaPhone || profile?.user?.phone || user.phone}
              </span>
              <span className="text-ink-400">· M-Pesa</span>
            </div>
            <Link href="/cleaner/dashboard" className="btn-ghost text-sm gap-1.5">
              Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* ── MAIN GRID ───────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">

          {/* Payout form */}
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                <ArrowUpRight className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-ink-900">Request payout</h2>
                <p className="text-xs text-ink-500">Send balance to M-Pesa</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="field-group mb-0">
                <label className="label">Amount (KES)</label>
                <input
                  type="number"
                  min={PAYMENT.MIN_WITHDRAWAL / 100}
                  step="50"
                  value={amountKes}
                  onChange={e => setAmountKes(e.target.value)}
                  placeholder="2000"
                  className="input"
                />
              </div>

              <div className="field-group mb-0">
                <label className="label">M-Pesa phone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={e => setMpesaPhone(e.target.value)}
                    placeholder="+254 712 345 678"
                    className="input pl-10"
                  />
                </div>
              </div>

              {/* Info card */}
              <div className="rounded-2xl bg-surface-50 border border-ink-100 px-4 py-4 text-xs text-ink-600 space-y-2">
                <div className="flex items-start gap-2">
                  <BadgeInfo className="h-3.5 w-3.5 text-brand-600 mt-0.5 flex-shrink-0" />
                  Minimum request: {formatKES(PAYMENT.MIN_WITHDRAWAL)}
                </div>
                <div className="flex items-start gap-2">
                  <BadgeInfo className="h-3.5 w-3.5 text-brand-600 mt-0.5 flex-shrink-0" />
                  Available balance: {formatKES(balance)}
                </div>
                <div className="flex items-start gap-2">
                  <BadgeInfo className="h-3.5 w-3.5 text-brand-600 mt-0.5 flex-shrink-0" />
                  Requests above {formatKES(PAYMENT.AUTO_APPROVE_PAYOUT_LIMIT)} may need admin approval.
                </div>
              </div>

              {errorMsg && (
                <div className="callout-danger">
                  <span>⚠️</span><span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-3 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-800">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                onClick={() => requestPayout.mutate({ amount: amountCents, mpesaPhone })}
                disabled={!canWithdraw}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestPayout.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Requesting…</>
                  : <><ArrowUpRight className="h-4 w-4" /> Withdraw {amountCents > 0 ? formatKES(amountCents) : 'funds'}</>
                }
              </button>

              {/* Verification status */}
              <div className="rounded-xl bg-surface-50 border border-ink-100 px-3 py-2.5 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <span className="text-xs text-ink-600">
                  Verification: <span className="font-semibold text-ink-800">{(profile?.verificationStatus ?? 'PENDING').replace('_', ' ')}</span>
                </span>
              </div>
            </div>
          </section>

          {/* Transaction history */}
          <section className="rounded-3xl bg-white shadow-[var(--shadow-card)] px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900">Wallet activity</h2>
                <p className="text-xs text-ink-500">Recent transactions</p>
              </div>
              <span className="badge bg-brand-50 text-brand-700">
                <TrendingUp className="h-3 w-3" />
                {wallet?.transactions.length ?? 0} entries
              </span>
            </div>

            {walletLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            )}

            {!walletLoading && !wallet?.transactions.length && (
              <div className="rounded-2xl border border-dashed border-ink-200 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-50">
                  <Wallet className="h-6 w-6 text-ink-300" />
                </div>
                <h3 className="mt-4 text-base font-bold text-ink-900">No activity yet</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-ink-500">
                  Earnings and withdrawals will appear here once a client confirms a completed job.
                </p>
              </div>
            )}

            {!!wallet?.transactions.length && (
              <div className="space-y-3">
                {wallet.transactions.map(tx => (
                  <div key={tx.id} className="flex items-start justify-between gap-4 rounded-2xl border border-ink-100 bg-surface-50 px-4 py-4 hover:border-ink-200 transition-colors">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`badge ${TX_STYLES[tx.type]}`}>{tx.type}</span>
                        <p className="text-sm font-semibold text-ink-900 truncate">{tx.description}</p>
                      </div>
                      <p className="text-xs text-ink-400">
                        {new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(tx.createdAt))}
                      </p>
                      {tx.bookingId && (
                        <Link href={`/bookings/${tx.bookingId}`} className="mt-1 inline-flex text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                          View booking
                        </Link>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-base font-extrabold ${tx.type === 'DEBIT' ? 'text-red-600' : 'text-mint-700'}`}>
                        {tx.type === 'DEBIT' ? '−' : '+'}{formatKES(tx.amount)}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400">Balance {formatKES(tx.balanceAfter)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function AccessGate({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-[var(--shadow-card)] overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-brand-400 to-brand-600" />
        <div className="px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
            <AlertCircle className="h-8 w-8 text-brand-600" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-ink-900">{title}</h2>
          <p className="mt-2 text-sm text-ink-500">{body}</p>
          <Link href={href} className="btn-primary mt-6 inline-flex">{cta} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}
