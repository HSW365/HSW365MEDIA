import React from 'react';
import { Check } from 'lucide-react';
import { CASHAPP } from '../constants';

interface Tier {
  name: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
}

interface Category {
  title: string;
  tiers: Tier[];
}

const pricingCategories: Category[] = [
  {
    title: 'Website Development',
    tiers: [
      {
        name: 'Starter Site',
        price: '$1,500',
        description: '5-page custom website, mobile-responsive, SEO basics.',
        features: ['5-page custom design', 'Mobile-responsive', 'SEO basics', 'Contact form', '1 revision round'],
      },
      {
        name: 'Business Site',
        price: '$3,500',
        description: 'Up to 10 pages, custom design, CMS integration, SEO optimization.',
        features: ['Up to 10 pages', 'Custom design', 'CMS integration', 'SEO optimization', '3 revision rounds'],
        featured: true,
      },
      {
        name: 'E-Commerce Pro',
        price: '$6,500',
        description: 'Full online store, payment gateway, inventory management.',
        features: ['Full online store', 'Payment gateway', 'Inventory management', 'Custom design', '3 months support'],
      }
    ]
  },
  {
    title: 'Media & Promotion',
    tiers: [
      {
        name: 'Podcast Launch',
        price: '$1,000',
        description: 'Setup, artwork, intro/outro, first 4 episodes, distribution.',
        features: ['Artwork & setup', 'Intro/outro production', 'First 4 episodes', 'Distribution setup'],
      },
      {
        name: 'Artist Campaign',
        price: '$500',
        description: '3 tracks to 10 stations, rotation, feature, social promotion.',
        features: ['3 tracks to 10 stations', '4-week rotation', 'Artist feature', 'Social promotion'],
        featured: true,
      },
      {
        name: 'Self-Publish Basic',
        price: '$600',
        description: 'Formatting, cover design, distribution to Amazon & Apple.',
        features: ['ePub/MOBI formatting', 'Cover design', 'Amazon distribution', 'Apple distribution'],
      }
    ]
  }
];

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-24 bg-frost">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-cobalt tracking-wide uppercase">Pricing & Packages</h2>
          <p className="mt-2 text-3xl font-extrabold text-midnight sm:text-4xl lg:text-5xl">
            Flexible Solutions for Every Vision
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-steel">
            Professional services tailored to your specific needs and goals.
          </p>
        </div>

        {pricingCategories.map((category, catIdx) => (
          <div key={catIdx} className="mt-20">
            <h3 className="text-2xl font-bold text-midnight mb-10 text-center lg:text-left">{category.title}</h3>
            <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
              {category.tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col transition-all hover:shadow-xl ${
                    tier.featured ? 'ring-2 ring-cobalt scale-105 z-10' : ''
                  }`}
                >
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-midnight">{tier.name}</h4>
                    {tier.featured && (
                      <p className="absolute top-0 py-1.5 px-4 bg-cobalt text-white text-xs font-semibold uppercase tracking-wide rounded-full transform -translate-y-1/2">
                        Most Popular
                      </p>
                    )}
                    <p className="mt-4 flex items-baseline text-midnight">
                      <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
                      {tier.price.startsWith('$') && !tier.price.includes('/') && <span className="ml-1 text-sm font-semibold text-steel">one-time</span>}
                    </p>
                    <p className="mt-6 text-steel">{tier.description}</p>

                    <ul className="mt-6 space-y-4">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex">
                          <Check className="flex-shrink-0 w-5 h-5 text-cyan" aria-hidden="true" />
                          <span className="ml-3 text-sm text-steel">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="#contact"
                    className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-bold transition-all ${
                      tier.featured
                        ? 'bg-cobalt text-white hover:opacity-90'
                        : 'bg-frost text-cobalt hover:bg-gray-200'
                    }`}
                  >
                    Select Package
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="mt-20 p-8 bg-midnight rounded-3xl text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Custom Solutions & Retainers</h3>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Need something more specific? We offer Fractional COO services, AI retainers, and full-scale managed marketing starting at $1,000/month.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#contact" className="bg-cyan text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all shadow-lg shadow-cyan/20">Get a Custom Quote</a>
            <div className="flex items-center gap-2 text-sm text-gray-300">
               <span>Accepted:</span>
               <span className="bg-slate-800 px-2 py-1 rounded">Stripe</span>
               <a href={CASHAPP} className="bg-slate-800 px-2 py-1 rounded hover:text-white transition-colors">Cash App ($hsw365)</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
