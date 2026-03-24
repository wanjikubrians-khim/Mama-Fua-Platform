// Mama Fua — Home Page
// KhimTech | 2026

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Smartphone,
  Star,
} from 'lucide-react';

const stats = [
  { label: 'Verified cleaners', value: '500+' },
  { label: 'Bookings completed', value: '10,000+' },
  { label: 'Average rating', value: '4.8/5' },
];

const services = [
  {
    name: 'Home Cleaning',
    price: 'From KES 1,200',
    desc: 'Routine household cleaning for bedrooms, kitchens, bathrooms, and shared spaces.',
  },
  {
    name: 'Laundry (Mama Fua)',
    price: 'From KES 500',
    desc: 'Wash, iron, and fold for households that want a reliable weekly handoff.',
  },
  {
    name: 'Office Cleaning',
    price: 'From KES 2,000',
    desc: 'Professional cleaning for desks, common areas, meeting rooms, and small offices.',
  },
  {
    name: 'Deep Cleaning',
    price: 'From KES 3,500',
    desc: 'A more thorough reset for move-ins, guests, or spaces that need extra attention.',
  },
  {
    name: 'Post-Construction',
    price: 'From KES 5,000',
    desc: 'Dust, residue, and debris removal after renovation or interior fit-out work.',
  },
  {
    name: 'Recurring Visits',
    price: 'Save up to 33%',
    desc: 'Weekly and monthly plans with a cleaner workflow and more predictable scheduling.',
  },
];

const steps = [
  {
    title: 'Choose a service',
    body: 'Start with the type of clean you need and how often you want it.',
  },
  {
    title: 'Set the location',
    body: 'Add the address, access notes, and the time that works best for you.',
  },
  {
    title: 'Confirm and pay',
    body: 'Review the booking, pay securely, and track the job from one place.',
  },
];

const trust = [
  {
    icon: ShieldCheck,
    title: 'Background verified',
    body: 'Each cleaner is checked before they join the platform.',
  },
  {
    icon: Star,
    title: 'Rated by clients',
    body: 'Real households leave reviews after completed jobs.',
  },
  {
    icon: Clock3,
    title: 'Fast matching',
    body: 'The booking flow is built to get from request to confirmation quickly.',
  },
  {
    icon: Smartphone,
    title: 'M-Pesa friendly',
    body: 'Payments are designed around the tools people already use.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen pb-10">
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              MF
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Mama Fua</p>
              <p className="text-xs text-ink-400">Cleaning marketplace</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost px-4 py-2.5 text-sm">
              Log in
            </Link>
            <Link href="/register" className="btn-primary px-4 py-2.5 text-sm">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-4 pb-12 pt-10 sm:px-6 sm:pt-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <span className="pill">
              <span className="h-2 w-2 rounded-full bg-mint-400" />
              Available in Nairobi
            </span>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
                Clean homes and laundry help, booked without the mess.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-ink-500">
                Mama Fua helps households and small teams book trusted cleaners with a fast flow,
                clear pricing, and M-Pesa-ready payments.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="btn-primary px-7 py-3 text-base">
                Book a cleaner
              </Link>
              <Link href="/register?role=CLEANER" className="btn-secondary px-7 py-3 text-base">
                Join as a cleaner
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-chip px-4 py-5">
                  <p className="text-2xl font-semibold text-ink-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-ink-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="dark-panel px-6 py-6 sm:px-7 sm:py-7">
              <p className="text-sm font-medium text-brand-100">Why people like this flow</p>
              <h2 className="mt-3 text-3xl text-white sm:text-4xl">
                Bright on the surface, direct underneath.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/70">
                Service choice, address, timing, and payment all sit in one clean path without extra
                noise.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/50">Payment</p>
                  <p className="mt-2 text-lg font-semibold text-white">Escrow protected</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/50">Coverage</p>
                  <p className="mt-2 text-lg font-semibold text-white">Homes and offices</p>
                </div>
              </div>
            </div>

            <div className="section-shell p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-700">Typical booking</p>
                  <h3 className="mt-1 text-2xl text-ink-900">Home cleaning</h3>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                  From KES 1,200
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  'Choose a cleaner automatically or browse first',
                  'Set address notes before confirmation',
                  'Pay with M-Pesa, wallet, or cash',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-mint-700" />
                    <span className="text-sm text-ink-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-700">Services</p>
              <h2 className="mt-1 text-3xl sm:text-4xl">Current available parts of the product</h2>
            </div>
            <Link
              href="/book"
              className="hidden items-center gap-2 text-sm font-semibold text-brand-700 sm:inline-flex"
            >
              Start booking <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.name} className="card">
                <p className="text-sm font-semibold text-brand-700">{service.price}</p>
                <h3 className="mt-2 text-2xl text-ink-900">{service.name}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-500">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="section-shell p-6 sm:p-8">
            <p className="text-sm font-medium text-brand-700">How it works</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Simple enough to use in a few minutes.</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-ink-500">
              The current booking flow already has the right product pieces. The UI just needs to
              stay out of the way.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="card">
                <p className="text-sm font-semibold text-brand-700">0{index + 1}</p>
                <h3 className="mt-3 text-2xl text-ink-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="dark-panel px-6 py-7 sm:px-8">
            <p className="text-sm font-medium text-brand-100">Trust</p>
            <h2 className="mt-2 text-3xl text-white sm:text-4xl">
              The darker sections should support the page, not take it over.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/70">
              This version keeps the contrast where it helps, then lets the bright surfaces do the
              rest of the work.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trust.map((item) => (
              <div key={item.title} className="card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <item.icon className="h-5 w-5 text-brand-700" />
                </div>
                <h3 className="mt-4 text-2xl text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-ink-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-8 sm:px-6">
        <div className="dark-panel mx-auto flex max-w-6xl flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="text-3xl text-white">Ready to book your first clean?</h2>
            <p className="mt-2 text-sm text-white/70">
              Use the current booking flow and test accounts already available in local dev.
            </p>
          </div>
          <Link href="/book" className="btn-secondary bg-white px-7 py-3 text-base">
            Book now
          </Link>
        </div>
      </section>
    </main>
  );
}
