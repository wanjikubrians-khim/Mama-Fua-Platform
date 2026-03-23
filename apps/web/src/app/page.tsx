// Mama Fua — Home Page
// KhimTech | 2026

import Link from 'next/link';
import { CheckCircle, MapPin, Shield, Star, Clock, Smartphone } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-brand-600">Mama Fua</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Log in</Link>
            <Link href="/register" className="btn-primary text-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-600 mb-6">
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
            Now available in Nairobi
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
            Trusted cleaners,{' '}
            <span className="text-brand-600">on your schedule</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Book verified professional cleaners and mama fuas near you. Fast, reliable, and paid securely via M-Pesa or card.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book" className="btn-primary text-base px-8 py-3">
              Book a cleaner
            </Link>
            <Link href="/register?role=CLEANER" className="btn-secondary text-base px-8 py-3">
              Join as a cleaner
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { label: 'Verified cleaners', value: '500+' },
            { label: 'Bookings completed', value: '10,000+' },
            { label: 'Average rating', value: '4.8 ★' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-brand-600">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-center text-gray-500 mb-14">Booking a cleaner takes under 2 minutes</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', icon: MapPin, title: 'Tell us your location', body: 'Enter your address and choose the service you need.' },
              { step: '02', icon: Star, title: 'Get matched instantly', body: 'We connect you to the nearest top-rated cleaner available.' },
              { step: '03', icon: CheckCircle, title: 'Pay securely after', body: 'Pay via M-Pesa or card. Funds held safely until job is done.' },
            ].map((item) => (
              <div key={item.step} className="card relative overflow-hidden">
                <span className="absolute top-4 right-4 text-5xl font-black text-gray-50 select-none">{item.step}</span>
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
                    <item.icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Services we offer</h2>
          <p className="text-center text-gray-500 mb-14">From one-off deep cleans to weekly recurring visits</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Home Cleaning', price: 'From KES 1,200', desc: 'Bedrooms, kitchen, bathrooms — fully cleaned.' },
              { name: 'Laundry (Mama Fua)', price: 'From KES 500', desc: 'Wash, iron, and fold. Fresh clothes every time.' },
              { name: 'Office Cleaning', price: 'From KES 2,000', desc: 'Professional cleaning for your workspace.' },
              { name: 'Deep Cleaning', price: 'From KES 3,500', desc: 'Intensive top-to-bottom clean for any space.' },
              { name: 'Post-Construction', price: 'From KES 5,000', desc: 'Dust, debris, and residue after a renovation.' },
              { name: 'Recurring Schedule', price: 'Save up to 33%', desc: 'Weekly or monthly — same cleaner every time.' },
            ].map((s) => (
              <div key={s.name} className="card hover:shadow-card-hover transition-shadow cursor-pointer">
                <h3 className="font-semibold text-gray-900 mb-1">{s.name}</h3>
                <p className="text-brand-600 text-sm font-medium mb-2">{s.price}</p>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-14">Why clients trust Mama Fua</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Background verified', body: 'Every cleaner is ID-checked before joining.' },
              { icon: Star, title: 'Ratings & reviews', body: 'Read real reviews from real clients.' },
              { icon: Clock, title: 'On-time guarantee', body: 'Cleaners arrive when scheduled or we reschedule free.' },
              { icon: Smartphone, title: 'Pay via M-Pesa', body: 'Pay securely via M-Pesa, card, or wallet.' },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
                  <f.icon className="h-7 w-7 text-teal-600" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-brand-600">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to book your first clean?</h2>
          <p className="text-brand-100 mb-8">Join thousands of households across Nairobi already using Mama Fua.</p>
          <Link href="/book" className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
            Book now — it's free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-brand-600">Mama Fua</span>
          <p className="text-sm text-gray-400">
            © 2026 KhimTech. Built by Brian Wanjiku & Maryann Wanjiru.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
            <Link href="/support" className="hover:text-gray-600">Support</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
