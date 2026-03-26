'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PAYMENT, formatKES } from '@mama-fua/shared';
import {
  AlertCircle,
  ArrowUpRight,
  BadgeInfo,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Loader2,
  Phone,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { cleanerApi, paymentsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface CleanerProfile {
  mpesaPhone: string | null;
  verificationStatus: string;
  user: {
    phone: string;
    firstName: string;
  };
}

interface WalletTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  bookingId: string | null;
  createdAt: string;
  description: string;
  type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE';
}

interface WalletPayload {
  balance: number;
  transactions: WalletTransaction[];
}

const TRANSACTION_STYLES: Record<WalletTransaction['type'], string> = {
  CREDIT: 'bg-teal-100 text-teal-800',
  DEBIT: 'bg-red-100 text-red-700',
  HOLD: 'bg-amber-100 text-amber-800',
  RELEASE: 'bg-brand-100 text-brand-800',
};

export default function CleanerWalletPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [amountKes, setAmountKes] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['cleaner-profile'],
    queryFn: () => cleanerApi.me(),
    enabled: user?.role === 'CLEANER',
  });

  const { data: walletRes, isLoading: walletLoading } = useQuery({
    queryKey: ['cleaner-wallet'],
    queryFn: () => cleanerApi.wallet(),
    enabled: user?.role === 'CLEANER',
  });

  const requestPayout = useMutation({
    mutationFn: (payload: { amount: number; mpesaPhone: string }) =>
      paymentsApi.payoutRequest({
        amount: payload.amount,
        method: 'MPESA',
        mpesaPhone: payload.mpesaPhone,
      }),
    onSuccess: () => {
      setAmountKes('');
      queryClient.invalidateQueries({ queryKey: ['cleaner-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['cleaner-profile'] });
    },
  });

  useEffect(() => {
    const profile: CleanerProfile | null = profileRes?.data?.data ?? null;
    if (!mpesaPhone && profile) {
      setMpesaPhone(profile.mpesaPhone || profile.user.phone || '');
    }
  }, [mpesaPhone, profileRes]);

  if (!user) {
    return (
      <WalletAccessState
        title="Sign in required"
        body="Log in with your cleaner account to access wallet balances and payouts."
        href="/login"
        cta="Go to login"
      />
    );
  }

  if (user.role !== 'CLEANER') {
    return (
      <WalletAccessState
        title="Cleaner wallet only"
        body="This payout screen is only available to cleaner accounts."
        href="/dashboard"
        cta="Open dashboard"
      />
    );
  }

  const profile: CleanerProfile | null = profileRes?.data?.data ?? null;
  const wallet: WalletPayload | null = walletRes?.data?.data ?? null;
  const balance = wallet?.balance ?? 0;
  const amountCents = Math.round((Number(amountKes) || 0) * 100);
  const canWithdraw =
    !!mpesaPhone &&
    amountCents >= PAYMENT.MIN_WITHDRAWAL &&
    amountCents <= balance &&
    !requestPayout.isPending;

  const errorMessage =
    (
      requestPayout.error as Error & {
        response?: { data?: { error?: { message?: string } } };
      }
    )?.response?.data?.error?.message ?? requestPayout.error?.message;

  const payoutMessage = requestPayout.data?.data?.data?.message as string | undefined;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(24,95,165,0.12),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="grid gap-4 xl:grid-cols-[1.06fr_0.94fr]">
          <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-6 py-6 text-white shadow-card sm:px-8 sm:py-8">
            <p className="text-sm font-medium text-brand-100">Cleaner wallet</p>
            <h1 className="mt-2 text-3xl sm:text-4xl">Withdraw what you’ve earned</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
              Your released earnings land here first. Send them to your M-Pesa line whenever you
              need a payout.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <WalletStat
                icon={<Wallet className="h-5 w-5 text-brand-100" />}
                label="Available now"
                value={formatKES(balance)}
                dark
              />
              <WalletStat
                icon={<CreditCard className="h-5 w-5 text-brand-100" />}
                label="Minimum withdrawal"
                value={formatKES(PAYMENT.MIN_WITHDRAWAL)}
                dark
              />
              <WalletStat
                icon={<ShieldCheck className="h-5 w-5 text-brand-100" />}
                label="Auto approval limit"
                value={formatKES(PAYMENT.AUTO_APPROVE_PAYOUT_LIMIT)}
                dark
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
                <CircleDollarSign className="h-6 w-6 text-brand-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-700">Payout destination</p>
                <h2 className="mt-1 text-2xl text-ink-900">M-Pesa</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Current phone
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-ink-800">
                  <Phone className="h-4 w-4 text-brand-600" />
                  {profile?.mpesaPhone || profile?.user.phone || user.phone}
                </p>
              </div>

              <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Verification
                </p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink-800 ring-1 ring-slate-200">
                  <ShieldCheck className="h-4 w-4 text-brand-700" />
                  {(profile?.verificationStatus ?? 'PENDING').replace('_', ' ')}
                </div>
              </div>

              <Link href="/cleaner/dashboard" className="btn-ghost mt-1 px-4 py-2.5 text-sm">
                Back to dashboard
              </Link>
            </div>
          </section>
        </header>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-card">
            <p className="text-sm font-medium text-brand-700">Request payout</p>
            <h2 className="mt-1 text-3xl text-ink-900">Send balance to M-Pesa</h2>
            <p className="mt-3 text-sm leading-7 text-ink-500">
              Enter the amount in Kenyan shillings. Small requests are processed automatically;
              higher amounts may wait for approval.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-700">Amount (KES)</span>
                <input
                  type="number"
                  min={PAYMENT.MIN_WITHDRAWAL / 100}
                  step="50"
                  value={amountKes}
                  onChange={(event) => setAmountKes(event.target.value)}
                  placeholder="2000"
                  className="input"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-700">M-Pesa phone</span>
                <input
                  type="tel"
                  value={mpesaPhone}
                  onChange={(event) => setMpesaPhone(event.target.value)}
                  placeholder="+254 712 345 678"
                  className="input"
                />
              </label>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-ink-600">
                <p className="font-semibold text-ink-800">Payout checks</p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2">
                    <BadgeInfo className="mt-0.5 h-4 w-4 text-brand-600" />
                    Minimum request is {formatKES(PAYMENT.MIN_WITHDRAWAL)}.
                  </li>
                  <li className="flex items-start gap-2">
                    <BadgeInfo className="mt-0.5 h-4 w-4 text-brand-600" />
                    Available balance: {formatKES(balance)}.
                  </li>
                  <li className="flex items-start gap-2">
                    <BadgeInfo className="mt-0.5 h-4 w-4 text-brand-600" />
                    Amounts above {formatKES(PAYMENT.AUTO_APPROVE_PAYOUT_LIMIT)} may need admin
                    approval.
                  </li>
                </ul>
              </div>

              {errorMessage && (
                <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {payoutMessage && (
                <div className="flex items-start gap-3 rounded-[1.4rem] border border-teal-200 bg-teal-50 px-4 py-4 text-sm text-teal-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{payoutMessage}</span>
                </div>
              )}

              <button
                onClick={() => requestPayout.mutate({ amount: amountCents, mpesaPhone })}
                disabled={!canWithdraw}
                className="btn-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                {requestPayout.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Requesting payout...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-5 w-5" />
                    Withdraw {amountCents > 0 ? formatKES(amountCents) : 'funds'}
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-700">Recent transactions</p>
                <h2 className="mt-1 text-3xl text-ink-900">Wallet activity</h2>
              </div>
              <span className="badge bg-brand-50 text-brand-800">
                {wallet?.transactions.length ?? 0} entries
              </span>
            </div>

            {(profileLoading || walletLoading) && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-brand-700" />
              </div>
            )}

            {!profileLoading && !walletLoading && !wallet?.transactions.length && (
              <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white">
                  <AlertCircle className="h-7 w-7 text-brand-700" />
                </div>
                <h3 className="mt-4 text-2xl text-ink-900">No wallet activity yet</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-500">
                  Once a client confirms a completed job, released earnings and withdrawals will
                  appear here.
                </p>
              </div>
            )}

            {!!wallet?.transactions.length && (
              <div className="mt-6 space-y-3">
                {wallet.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge ${TRANSACTION_STYLES[transaction.type]}`}>
                          {transaction.type}
                        </span>
                        <p className="text-sm font-semibold text-ink-900">
                          {transaction.description}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-ink-500">
                        {new Intl.DateTimeFormat('en-KE', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(transaction.createdAt))}
                      </p>
                      {transaction.bookingId && (
                        <Link
                          href={`/bookings/${transaction.bookingId}`}
                          className="mt-2 inline-flex text-sm font-semibold text-brand-700 hover:underline"
                        >
                          View related booking
                        </Link>
                      )}
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-base font-semibold ${
                          transaction.type === 'DEBIT' ? 'text-red-700' : 'text-teal-800'
                        }`}
                      >
                        {transaction.type === 'DEBIT' ? '-' : '+'}
                        {formatKES(transaction.amount)}
                      </p>
                      <p className="mt-2 text-xs text-ink-400">
                        Balance {formatKES(transaction.balanceAfter)}
                      </p>
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

function WalletStat({
  icon,
  label,
  value,
  dark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border px-4 py-4 ${
        dark ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${dark ? 'bg-white/10' : 'bg-brand-50'}`}
        >
          {icon}
        </div>
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.16em] ${dark ? 'text-white/60' : 'text-ink-400'}`}
          >
            {label}
          </p>
          <p className={`mt-1 text-xl font-semibold ${dark ? 'text-white' : 'text-ink-900'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function WalletAccessState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white px-8 py-10 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
          <AlertCircle className="h-8 w-8 text-brand-700" />
        </div>
        <h1 className="mt-5 text-3xl text-ink-900">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-ink-500">{body}</p>
        <Link href={href} className="btn-primary mt-7 px-6 py-3">
          {cta}
        </Link>
      </div>
    </div>
  );
}
