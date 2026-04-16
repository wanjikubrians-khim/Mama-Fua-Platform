// Mama Fua — Landing Page
// KhimTech | 2026

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
  Smartphone,
  Zap,
  Users,
  BadgeCheck,
  ChevronRight,
} from 'lucide-react';

const stats = [
  { label: 'Verified cleaners', value: '500+' },
  { label: 'Bookings completed', value: '10K+' },
  { label: 'Average rating', value: '4.8★' },
];

const services = [
  { name: 'Home Cleaning',     price: 'From KES 1,200', emoji: '🏠', desc: 'Bedrooms, kitchen, bathrooms & shared spaces.' },
  { name: 'Laundry',           price: 'From KES 500',   emoji: '👕', desc: 'Wash, iron, fold — weekly or one-off.' },
  { name: 'Office Cleaning',   price: 'From KES 2,000', emoji: '🏢', desc: 'Desks, meeting rooms, common areas.' },
  { name: 'Deep Cleaning',     price: 'From KES 3,500', emoji: '✨', desc: 'Intensive reset for carpets, windows, upholstery.' },
  { name: 'Post-Construction', price: 'From KES 5,000', emoji: '🔨', desc: 'Dust and debris removal after renovation.' },
  { name: 'Recurring Visits',  price: 'Save up to 33%', emoji: '🔄', desc: 'Weekly or monthly plans with the same cleaner.' },
];

const steps = [
  {
    num: '01',
    title: 'Choose a service',
    body: 'Pick the type of clean you need. Auto-match, browse cleaners, or post and let them bid.',
    icon: Zap,
  },
  {
    num: '02',
    title: 'Set your location',
    body: 'Add your address and any access instructions. We geocode it and find cleaners nearby.',
    icon: MapPin,
  },
  {
    num: '03',
    title: 'Confirm and pay',
    body: 'Pay securely with M-Pesa, card, or wallet. Funds are held in escrow until the job is done.',
    icon: CheckCircle2,
  },
];

const trust = [
  {
    icon: BadgeCheck,
    title: 'Background verified',
    body: 'Every cleaner provides a national ID and completes a selfie match before going live.',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    icon: Star,
    title: 'Rated after every job',
    body: 'Real reviews from real households. Ratings are public and affect cleaner ranking.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Clock3,
    title: 'Matched in minutes',
    body: 'The matching engine finds the nearest, highest-rated cleaner and notifies them instantly.',
    color: 'bg-mint-50 text-mint-600',
  },
  {
    icon: Smartphone,
    title: 'M-Pesa ready',
    body: 'Pay with M-Pesa STK push — the most common payment method in Kenya.',
    color: 'bg-green-50 text-green-600',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface-50">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="hero-dark text-white">
        {/* Navbar inside hero */}
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-extrabold text-white shadow-brand">
              MF
            </span>
            <div>
              <p className="text-sm font-bold text-white leading-none">Mama Fua</p>
              <p className="text-[10px] text-white/50 leading-none mt-0.5 uppercase tracking-widest">KhimTech</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="btn text-sm text-white/70 px-4 py-2 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="btn-primary text-sm"
            >
              Get started
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70">
              <span className="h-2 w-2 rounded-full bg-mint-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Now available in Nairobi
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Professional cleaners,{' '}
              <span className="text-brand-400">on demand.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60">
              Book vetted, background-checked cleaners in Nairobi. Pay with M-Pesa.
              Track the job in real time. Escrow-protected.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/book" className="btn-primary-lg w-full sm:w-auto">
                Book a cleaner
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/register?role=CLEANER" className="btn-secondary-lg w-full bg-white/5 border-white/10 text-white hover:bg-white/10 sm:w-auto">
                Join as a cleaner
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-4 sm:max-w-xl">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-white sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero bottom curve */}
        <div className="relative h-10 overflow-hidden">
          <div
            className="absolute inset-x-0 bottom-0 h-20"
            style={{ background: '#fafafa', clipPath: 'ellipse(55% 100% at 50% 100%)' }}
          />
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────── */}
      <section className="bg-surface-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-label">Services</span>
              <h2 className="mt-3 text-3xl font-extrabold text-ink-900 sm:text-4xl">
                What do you need today?
              </h2>
              <p className="mt-2 max-w-md text-base text-ink-500">
                From quick home cleans to deep post-construction work — all booked in minutes.
              </p>
            </div>
            <Link
              href="/book"
              className="hidden items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:inline-flex"
            >
              Start booking <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.name}
                href={`/book?service=${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group card-hover flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                    {service.emoji}
                  </span>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                    {service.price}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink-900 group-hover:text-brand-700 transition-colors">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-500 leading-relaxed">{service.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Book now <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="bg-ink-900 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="section-label-mint">How it works</span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Booked in under 3 minutes.
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-base text-white/50">
              The entire flow — service, location, time, payment — lives in one clean path.
            </p>
          </div>

          <div className="relative grid gap-8 sm:grid-cols-3">
            {/* Connector line (desktop) */}
            <div className="absolute left-[calc(50%/3+16.5%)] right-[calc(50%/3+16.5%)] top-10 hidden h-px bg-white/10 sm:block" />

            {steps.map((step) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10">
                  <step.icon className="h-8 w-8 text-brand-400" />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-extrabold text-white">
                    {step.num.replace('0', '')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50 max-w-[220px]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/book" className="btn-primary-lg">
              Try it now — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST / FEATURES ─────────────────────────────────────────── */}
      <section className="bg-surface-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="section-label">Why people trust us</span>
              <h2 className="mt-3 text-3xl font-extrabold text-ink-900 sm:text-4xl">
                Safety and quality built into every booking.
              </h2>
              <p className="mt-3 text-base text-ink-500 leading-relaxed">
                Every step — from identity verification to payment escrow — is designed
                to protect both clients and cleaners.
              </p>
              <Link href="/register" className="btn-primary mt-8 inline-flex">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {trust.map((item) => (
                <div key={item.title} className="card group">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-ink-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CLEANER CTA ──────────────────────────────────────────────── */}
      <section className="bg-brand-600 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <Users className="h-3.5 w-3.5" /> For cleaners
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                Earn more with a reliable stream of clients.
              </h2>
              <p className="mt-3 text-base text-white/70 leading-relaxed">
                Join 500+ professional cleaners on Mama Fua. Build your reputation,
                set your availability, and get paid digitally — right on M-Pesa.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register?role=CLEANER" className="btn bg-white text-brand-700 font-bold px-7 py-3.5 text-base rounded-2xl hover:bg-brand-50 shadow-lg">
                  Join as a cleaner
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: '💳', label: 'M-Pesa payouts', body: 'Withdraw your earnings directly to M-Pesa within the hour.' },
                { icon: '⭐', label: 'Build reputation', body: 'Your reviews and ratings follow you, attracting better clients.' },
                { icon: '📅', label: 'You set hours', body: 'Set your availability and service area. Accept only jobs that fit.' },
                { icon: '🛡️', label: 'Escrow protection', body: 'Payment is secured before you start. No more chasing clients.' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 border border-white/10 p-5">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="mt-3 text-sm font-bold text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-white/60 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
      <section className="bg-ink-900 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-5xl">
            Ready for a clean home?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/50">
            Join thousands of Nairobi households. Book your first clean in under 3 minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/book" className="btn-primary-lg w-full sm:w-auto">
              Book a cleaner now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary-lg w-full bg-white/5 border-white/10 text-white hover:bg-white/10 sm:w-auto">
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-ink-800 bg-ink-950 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-extrabold text-white">MF</span>
            <div>
              <p className="text-sm font-bold text-white">Mama Fua</p>
              <p className="text-xs text-ink-500">Cleaning marketplace · Nairobi, Kenya</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-ink-500">
            <Link href="/login" className="hover:text-white transition-colors">Log in</Link>
            <Link href="/register" className="hover:text-white transition-colors">Sign up</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
          </div>
          <p className="text-xs text-ink-600">© 2026 KhimTech. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
