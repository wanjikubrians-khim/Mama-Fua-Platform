import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, MapPin, ShieldCheck, Smartphone, Star, Sparkles, Users } from 'lucide-react';

const stats = [
  { label: 'Verified cleaners', value: '500+' },
  { label: 'Bookings completed', value: '10,000+' },
  { label: 'Average rating', value: '4.8★' },
];

const services = [
  { name: 'Home Cleaning', price: 'From KES 1,200', desc: 'Bedrooms, kitchen, bathrooms — done properly.', icon: '🏠' },
  { name: 'Laundry', price: 'From KES 500', desc: 'Wash, iron, and fold by a trusted mama fua.', icon: '👕' },
  { name: 'Office Cleaning', price: 'From KES 2,000', desc: 'Keep your workspace clean without the hassle.', icon: '🏢' },
  { name: 'Deep Cleaning', price: 'From KES 3,500', desc: 'A thorough reset — carpets, windows, upholstery.', icon: '✨' },
  { name: 'Post-Construction', price: 'From KES 5,000', desc: 'Dust, debris, and residue removed after renovation.', icon: '🔨' },
  { name: 'Recurring Plans', price: 'Save up to 33%', desc: 'Weekly or monthly — same cleaner, better price.', icon: '📅' },
];

const steps = [
  { num: '01', title: 'Choose a service', body: 'Select the type of clean and how often you need it.' },
  { num: '02', title: 'Set your location', body: 'Add the address, access notes, and a time that works.' },
  { num: '03', title: 'Pay and track', body: 'Secure M-Pesa payment, then watch the job progress live.' },
];

const trust = [
  { icon: ShieldCheck, title: 'Background verified', body: 'Every cleaner is checked before joining.' },
  { icon: Star,        title: 'Rated by real clients', body: 'Reviews come from completed jobs only.' },
  { icon: Clock3,      title: 'Fast matching',         body: 'Auto-assign finds the right cleaner in minutes.' },
  { icon: Smartphone,  title: 'M-Pesa ready',          body: 'Pay the way Kenya already does.' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--ink-50)' }}>
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: 'var(--brand-600)' }}>MF</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>Mama Fua</p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--ink-400)' }}>by KhimTech</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login"    className="btn-ghost   px-4 py-2 text-sm">Log in</Link>
            <Link href="/register" className="btn-primary px-4 py-2 text-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="px-5 pb-12 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          {/* Availability pill */}
          <div className="mb-7 flex items-center gap-2">
            <span className="pill">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live in Nairobi
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Left col */}
            <div className="space-y-8">
              <h1 className="max-w-2xl text-5xl leading-[1.08] sm:text-6xl" style={{ color: 'var(--ink-900)' }}>
                Clean homes and laundry help,{' '}
                <span className="text-gradient">booked in minutes.</span>
              </h1>
              <p className="max-w-xl text-lg leading-8" style={{ color: 'var(--ink-500)' }}>
                Mama Fua connects Kenyan households with vetted, rated cleaners — with M-Pesa payments and live tracking built in.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/book"                   className="btn-primary  px-7 py-3.5 text-base">Book a cleaner</Link>
                <Link href="/register?role=CLEANER"  className="btn-secondary px-7 py-3.5 text-base">Join as a cleaner</Link>
              </div>

              {/* Stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map(stat => (
                  <div key={stat.label} className="stat-chip">
                    <p className="text-2xl font-bold" style={{ color: 'var(--ink-900)', fontFamily: 'Sora, sans-serif' }}>{stat.value}</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--ink-500)' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right col */}
            <div className="space-y-4">
              {/* Dark hero card */}
              <div className="dark-panel px-6 py-7">
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--brand-300)' }}>How it works</p>
                <h2 className="mt-3 text-3xl text-white">From request to confirmed in under 5 minutes.</h2>
                <p className="mt-3 text-sm leading-7" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Service, address, time, and payment — all in one clean flow without the friction.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[['Payment','Escrow protected'],['Coverage','Homes & offices']].map(([label, val]) => (
                    <div key={label} className="rounded-xl px-4 py-4" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
                      <p className="mt-2 text-base font-semibold text-white">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking preview card */}
              <div className="section-shell p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-600)' }}>Typical booking</p>
                    <h3 className="mt-1 text-xl" style={{ color: 'var(--ink-900)' }}>Home cleaning</h3>
                  </div>
                  <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>From KES 1,200</span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {['Choose a cleaner automatically or browse first','Set address notes before confirmation','Pay with M-Pesa, wallet, or cash'].map(item => (
                    <div key={item} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--ink-50)' }}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand-600)' }} />
                      <span className="text-sm" style={{ color: 'var(--ink-600)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-600)' }}>Services</p>
              <h2 className="mt-2 text-3xl sm:text-4xl" style={{ color: 'var(--ink-900)' }}>What we offer</h2>
            </div>
            <Link href="/book" className="hidden items-center gap-1.5 text-sm font-semibold sm:inline-flex" style={{ color: 'var(--brand-700)' }}>
              Start booking <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(svc => (
              <Link key={svc.name} href="/book" className="card group transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5 block">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{svc.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--brand-700)' }}>{svc.price}</p>
                    <h3 className="mt-1 text-lg" style={{ color: 'var(--ink-900)' }}>{svc.name}</h3>
                    <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ink-500)' }}>{svc.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="section-shell p-7">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-600)' }}>Process</p>
              <h2 className="mt-2 text-3xl" style={{ color: 'var(--ink-900)' }}>Simple enough to use in minutes.</h2>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--ink-500)' }}>The booking flow stays out of the way — three steps and you're done.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map(step => (
                <div key={step.title} className="card">
                  <p className="text-2xl font-bold" style={{ color: 'var(--brand-200)', fontFamily: 'Sora, sans-serif' }}>{step.num}</p>
                  <h3 className="mt-3 text-lg" style={{ color: 'var(--ink-900)' }}>{step.title}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ink-500)' }}>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="dark-panel flex flex-col justify-center px-7 py-8">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--brand-300)' }}>Trust</p>
              <h2 className="mt-3 text-3xl text-white">Built for the Kenyan market from the ground up.</h2>
              <p className="mt-3 text-sm leading-7" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Every feature — payments, verification, matching — is designed around how Kenya actually works.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trust.map(item => (
                <div key={item.title} className="card">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--brand-50)' }}>
                    <item.icon className="h-5 w-5" style={{ color: 'var(--brand-700)' }} />
                  </div>
                  <h3 className="mt-4 text-lg" style={{ color: 'var(--ink-900)' }}>{item.title}</h3>
                  <p className="mt-1 text-sm leading-6" style={{ color: 'var(--ink-500)' }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="dark-panel flex flex-col gap-6 px-7 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl text-white">Ready to book your first clean?</h2>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>Nairobi coverage, M-Pesa payment, live tracking.</p>
            </div>
            <Link href="/book" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold transition-all hover:bg-brand-50 active:scale-[0.98]" style={{ color: 'var(--brand-700)' }}>
              Book now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-ink-100 px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: 'var(--brand-600)' }}>MF</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink-700)' }}>Mama Fua</span>
            <span className="text-xs" style={{ color: 'var(--ink-400)' }}>by KhimTech · 2026</span>
          </div>
          <div className="flex gap-5 text-sm" style={{ color: 'var(--ink-400)' }}>
            <Link href="/login"    className="hover:text-ink-700 transition-colors">Log in</Link>
            <Link href="/register" className="hover:text-ink-700 transition-colors">Sign up</Link>
            <Link href="/register?role=CLEANER" className="hover:text-ink-700 transition-colors">Join as cleaner</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
