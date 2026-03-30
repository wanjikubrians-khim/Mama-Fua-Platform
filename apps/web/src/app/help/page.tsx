'use client';
// Mama Fua — Help & Support Center
// KhimTech | 2026

import { useState } from 'react';
import { Search, Phone, Mail, MessageCircle, HelpCircle, ChevronRight, Book, Shield, ShieldCheck, CreditCard, Users, MapPin, Clock, CheckCircle } from 'lucide-react';

const categories = [
  {
    id: 'booking',
    title: 'Booking & Services',
    icon: Book,
    description: 'How to book, manage, and get the most from our cleaning services',
    articles: [
      'How to book a cleaner',
      'Understanding service types',
      'Managing your bookings',
      'Rescheduling and cancellations',
      'Service pricing explained',
    ],
  },
  {
    id: 'payment',
    title: 'Payment & Billing',
    icon: CreditCard,
    description: 'Payment methods, pricing, refunds, and billing questions',
    articles: [
      'Payment methods accepted',
      'Understanding service pricing',
      'Requesting a refund',
      'Viewing payment history',
      'M-Pesa payment guide',
    ],
  },
  {
    id: 'account',
    title: 'Account Management',
    icon: Users,
    description: 'Profile settings, security, and account preferences',
    articles: [
      'Updating your profile',
      'Managing saved addresses',
      'Notification settings',
      'Password and security',
      'Deleting your account',
    ],
  },
  {
    id: 'safety',
    title: 'Safety & Trust',
    icon: Shield,
    description: 'Safety measures, verification, and dispute resolution',
    articles: [
      'Cleaner verification process',
      'Safety during services',
      'Dispute resolution',
      'Insurance coverage',
      'Reporting issues',
    ],
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: HelpCircle,
    description: 'App issues, website problems, and technical troubleshooting',
    articles: [
      'App not working',
      'Website troubleshooting',
      'Notification problems',
      'Login issues',
      'Performance tips',
    ],
  },
];

const faqs = [
  {
    question: 'How do I book a cleaning service?',
    answer: 'Simply select your service type, choose your location and preferred time, and confirm your booking. You can either auto-assign a cleaner or browse available cleaners in your area.',
    category: 'booking',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept M-Pesa, wallet payments, and cash on completion. M-Pesa is the most popular and recommended payment method.',
    category: 'payment',
  },
  {
    question: 'Can I reschedule or cancel my booking?',
    answer: 'Yes, you can reschedule or cancel bookings up to 2 hours before the scheduled time without any penalty. Late cancellations may incur a fee.',
    category: 'booking',
  },
  {
    question: 'How are cleaners vetted?',
    answer: 'All cleaners undergo background checks, ID verification, and skill assessment. They must maintain high ratings to remain on the platform.',
    category: 'safety',
  },
  {
    question: 'What if I\'m not satisfied with the service?',
    answer: 'You can report issues within 24 hours of service completion. We have a dispute resolution process to address concerns and ensure satisfaction.',
    category: 'safety',
  },
  {
    question: 'How do I become a cleaner?',
    answer: 'Sign up as a cleaner, complete your profile with experience and service areas, set your pricing, and complete the verification process to start receiving bookings.',
    category: 'account',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredCategories = categories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-ink-900">Help Center</h1>
          <p className="mt-4 text-lg text-ink-600">
            Find answers to common questions and get support for Mama Fua services
          </p>
        </header>

        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search for help articles, FAQs, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-12 py-4 text-lg"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-ink-900 mb-6">Popular Topics</h2>
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="section-shell p-6 cursor-pointer transition-colors hover:border-brand-200"
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                        <category.icon className="h-6 w-6 text-brand-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-ink-900">{category.title}</h3>
                        <p className="mt-1 text-sm text-ink-600">{category.description}</p>
                        {selectedCategory === category.id && (
                          <div className="mt-4 space-y-2">
                            {category.articles.map((article) => (
                              <div
                                key={article}
                                className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm"
                              >
                                <span className="text-ink-700">{article}</span>
                                <ChevronRight className="h-4 w-4 text-ink-400" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-ink-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <div key={index} className="section-shell overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full p-6 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-ink-900">{faq.question}</h3>
                        <ChevronRight
                          className={`h-5 w-5 text-ink-400 transition-transform ${
                            expandedFaq === index ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                      {expandedFaq === index && (
                        <p className="mt-3 text-sm text-ink-600 leading-relaxed">{faq.answer}</p>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="section-shell p-6">
              <h2 className="text-lg font-semibold text-ink-900 mb-4">Contact Support</h2>
              <div className="space-y-4">
                <a
                  href="tel:+254700000000"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <Phone className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="font-medium text-ink-900">Phone Support</p>
                    <p className="text-sm text-ink-600">+254 700 000 000</p>
                    <p className="text-xs text-ink-500">Mon-Fri, 8AM-6PM</p>
                  </div>
                </a>

                <a
                  href="mailto:support@mamafua.co.ke"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <Mail className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="font-medium text-ink-900">Email Support</p>
                    <p className="text-sm text-ink-600">support@mamafua.co.ke</p>
                    <p className="text-xs text-ink-500">24-48 hour response</p>
                  </div>
                </a>

                <button className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-brand-200 hover:bg-brand-50/40">
                  <MessageCircle className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="font-medium text-ink-900">Live Chat</p>
                    <p className="text-sm text-ink-600">Chat with our team</p>
                    <p className="text-xs text-ink-500">Available 9AM-6PM</p>
                  </div>
                </button>
              </div>
            </section>

            <section className="section-shell p-6">
              <h2 className="text-lg font-semibold text-ink-900 mb-4">Quick Links</h2>
              <div className="space-y-3">
                {[
                  { title: 'Terms of Service', href: '/terms' },
                  { title: 'Privacy Policy', href: '/privacy' },
                  { title: 'Safety Guidelines', href: '/safety' },
                  { title: 'Refund Policy', href: '/refunds' },
                  { title: 'Cleaner Guidelines', href: '/cleaner-guidelines' },
                ].map((link) => (
                  <a
                    key={link.title}
                    href={link.href}
                    className="flex items-center justify-between rounded-lg p-3 text-sm transition-colors hover:bg-slate-50"
                  >
                    <span className="text-ink-700">{link.title}</span>
                    <ChevronRight className="h-4 w-4 text-ink-400" />
                  </a>
                ))}
              </div>
            </section>

            <section className="section-shell p-6">
              <h2 className="text-lg font-semibold text-ink-900 mb-4">Emergency Support</h2>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Urgent Issues</p>
                    <p className="mt-1 text-sm text-red-700">
                      For emergency situations during active bookings, call our hotline immediately.
                    </p>
                    <p className="mt-2 font-mono text-sm text-red-800">+254 700 000 999</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="section-shell p-8 text-center">
          <h2 className="text-2xl font-bold text-ink-900 mb-4">Still need help?</h2>
          <p className="text-ink-600 mb-6">
            Our support team is here to help you with any questions or concerns.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button className="btn-primary px-6 py-3">
              <MessageCircle className="mr-2 h-4 w-4" />
              Start Live Chat
            </button>
            <button className="btn-secondary px-6 py-3">
              <Mail className="mr-2 h-4 w-4" />
              Email Support
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
