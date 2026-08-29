'use client';

import React from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: [
      'Daily Cosmic Forecast (3 days)',
      'Basic Panchang',
      '1 Family Profile',
      'LocalStorage only',
    ],
    cta: 'Current Plan',
    popular: false,
  },
  {
    name: 'Cosmic Prime',
    price: '₹99',
    period: '/month',
    features: [
      '30-day Personalized Forecast',
      'WhatsApp Morning Digest',
      'Unlimited Family Profiles',
      'Advanced Dasha Alerts',
      'Priority Scholar Response',
    ],
    cta: 'Start 7-day Free Trial',
    popular: true,
  },
  {
    name: 'Family Eternal',
    price: '₹249',
    period: '/month',
    features: [
      'Everything in Prime',
      'Up to 8 Family Members',
      'Shared Family Calendar',
      'Annual PDF Reports',
      'Dedicated Scholar Channel',
    ],
    cta: 'Choose Family Plan',
    popular: false,
  },
];

export default function SubscriptionPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <div className="text-xs tracking-[3px] text-[#8E6F1D]">RETENTION + REVENUE</div>
        <h1 className="font-editorial text-6xl font-bold tracking-tight mt-3">Stay Connected to the Cosmos</h1>
        <p className="mt-4 text-xl text-[#57524A]">Daily Vedic intelligence delivered to you.</p>
      </div>

      <div className="mt-14 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`rounded-3xl border p-8 flex flex-col ${plan.popular ? 'border-[#8E6F1D] bg-white shadow-xl scale-[1.02]' : 'border-[#8E6F1D]/20 bg-white'}`}
          >
            {plan.popular && (
              <div className="inline-block self-start px-4 py-1 text-xs rounded-full bg-[#8E6F1D] text-white mb-4">Most Popular</div>
            )}
            <div className="font-editorial text-4xl font-bold">{plan.price}</div>
            <div className="text-sm text-[#857E74]">{plan.period}</div>
            <div className="font-semibold text-xl mt-6">{plan.name}</div>

            <ul className="mt-8 space-y-3 text-sm flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#8E6F1D]" /> {feature}
                </li>
              ))}
            </ul>

            <Link 
              href={plan.name === 'Free' ? '/dashboard' : '/profile'}
              className={`mt-8 block text-center py-4 rounded-2xl font-semibold text-sm ${plan.popular ? 'bg-[#8E6F1D] text-white' : 'border border-[#8E6F1D]/30'}`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 text-xs text-[#857E74]">
        Cancel anytime. No hidden fees. DPDP compliant.
      </div>
    </main>
  );
}
