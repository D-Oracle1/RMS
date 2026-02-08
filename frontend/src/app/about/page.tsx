'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  CheckCircle2,
  Target,
  Eye,
  Heart,
  Gem,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import { getImageUrl } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ICON_MAP: Record<string, any> = {
  Eye, Target, Heart, Gem, Star, Building2, Users, TrendingUp, Shield: Eye,
};

const DEFAULTS = {
  about: {
    title: 'The Most Trusted Real Estate Platform',
    subtitle: 'About Us',
    content: "<p>We've been helping people find their dream properties for over a decade. Our platform combines cutting-edge technology with experienced professionals.</p>",
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  },
  mission: {
    missionTitle: 'Our Mission',
    missionContent: '<p>To revolutionize the property market by providing a seamless platform that connects buyers, sellers, and agents. We leverage technology to eliminate the friction traditionally associated with property transactions.</p>',
    visionTitle: 'Our Vision',
    visionContent: '<p>To be the most trusted and innovative real estate platform in Africa, empowering millions to find their perfect property.</p>',
  },
  core_values: {
    values: [
      { icon: 'Eye', title: 'Transparency', description: 'Complete visibility into pricing, processes, and property details at every step' },
      { icon: 'Target', title: 'Innovation', description: 'Leveraging the latest technology to transform the real estate experience' },
      { icon: 'Heart', title: 'Customer First', description: 'Every decision we make starts with our users and their needs' },
      { icon: 'Gem', title: 'Excellence', description: 'Committed to the highest standards in service, quality, and results' },
    ],
  },
  stats: {
    stats: [
      { value: '10K+', label: 'Properties Managed' },
      { value: '₦500B+', label: 'Total Sales Volume' },
      { value: '2,500+', label: 'Active Realtors' },
      { value: '99.9%', label: 'Client Satisfaction' },
    ],
  },
};

export default function AboutPage() {
  const [cms, setCms] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/cms/public`)
      .then((r) => r.ok ? r.json() : null)
      .then((raw) => {
        const data = raw?.data || raw;
        if (data && typeof data === 'object') setCms(data);
      })
      .catch(() => {});
  }, []);

  const about = { ...DEFAULTS.about, ...cms.about };
  const mission = { ...DEFAULTS.mission, ...cms.mission };
  const coreValues = { ...DEFAULTS.core_values, ...cms.core_values };
  const stats = { ...DEFAULTS.stats, ...cms.stats };

  const heroImage = about.image?.startsWith('http') ? about.image : getImageUrl(about.image || '');

  return (
    <div className="min-h-screen bg-white dark:bg-primary-950">
      <PublicNavbar currentPage="/about" branding={cms.branding} />

      {/* Hero */}
      <section className="relative pt-16 min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Modern buildings"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="max-w-2xl">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">{about.subtitle || 'About Us'}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6">{about.title}</h1>
            <div className="text-lg text-white/80 max-w-xl prose prose-invert" dangerouslySetInnerHTML={{ __html: about.content || '' }} />
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4 bg-white dark:bg-primary-950">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-accent font-semibold text-sm uppercase tracking-wider">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 text-gray-900 dark:text-white">
                Building Trust in Real Estate Since Day One
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                RMS Platform was born from a simple idea: real estate transactions should be transparent, efficient, and accessible to everyone. What started as a small team with a vision has grown into one of Nigeria&apos;s most trusted real estate platforms.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Our mission is to revolutionize the property market by providing a seamless platform that connects buyers, sellers, and agents. We leverage technology to eliminate the friction traditionally associated with property transactions.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Today, we manage thousands of property listings, support hundreds of realtors, and have facilitated billions of naira in successful transactions. But we&apos;re just getting started.
              </p>
            </div>
            <div className="relative">
              <div className="relative h-[450px] rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80"
                  alt="Modern building"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-accent text-white p-6 rounded-2xl shadow-accent">
                <div className="text-4xl font-bold">10+</div>
                <div className="text-white/90">Years of Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 bg-primary dark:bg-primary-900">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">{mission.missionTitle}</h3>
              <div className="text-white/80 prose prose-invert" dangerouslySetInnerHTML={{ __html: mission.missionContent || '' }} />
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">{mission.visionTitle}</h3>
              <div className="text-white/80 prose prose-invert" dangerouslySetInnerHTML={{ __html: mission.visionContent || '' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-primary-900">
        <div className="container mx-auto">
          <div className="bg-white dark:bg-primary-800 rounded-3xl p-8 md:p-12 shadow-xl">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {(stats.stats || []).map((stat: any, index: number) => {
                const StatIcon = [Building2, TrendingUp, Users, Star][index % 4];
                return (
                  <div key={index} className="group">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all">
                      <StatIcon className="w-8 h-8 text-accent group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-2">{stat.value}</div>
                    <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-white dark:bg-primary-950">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <span className="text-accent font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 text-gray-900 dark:text-white">What Sets Us Apart</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                We don&apos;t just list properties &mdash; we create experiences. Our platform is designed to make every step of your property journey smooth and transparent.
              </p>
              <div className="space-y-4">
                {[
                  'Verified property listings with detailed information',
                  'Expert agents available 24/7 for assistance',
                  'Secure transactions with full transparency',
                  'AI-powered property recommendations',
                  'Real-time market insights and analytics',
                  'Dedicated support for buyers, sellers, and agents',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/properties">
                  <Button size="lg" className="bg-accent hover:bg-accent-600 text-white shadow-accent">
                    Explore Properties
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80"
                alt="Modern interior"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-primary-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Our Values</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">What We Stand For</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(coreValues.values || []).map((value: any, index: number) => {
              const ValueIcon = ICON_MAP[value.icon] || [Eye, Target, Heart, Gem][index % 4];
              return (
                <div key={index} className="bg-white dark:bg-primary-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:scale-110 transition-all">
                    <ValueIcon className="w-8 h-8 text-accent group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary via-primary-600 to-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Join Our Success Story</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Whether you&apos;re buying, selling, or managing properties, RMS Platform is your trusted partner
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-accent hover:bg-accent-600 text-white shadow-accent text-lg px-8">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white/40 hover:bg-white/10 text-lg px-8">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter cmsData={cms.footer} branding={cms.branding} />
    </div>
  );
}
