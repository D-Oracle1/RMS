'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  TrendingUp,
  Shield,
  BarChart3,
  MessageSquare,
  Award,
  Zap,
  Search,
  ArrowRight,
  Home,
  Heart,
  Calendar,
  Eye,
  Calculator,
  UserCheck,
  LineChart,
  HeartHandshake,
  UsersRound,
  FileText,
  Settings,
  Lock,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import { getImageUrl } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ICON_MAP: Record<string, any> = {
  Users, Building2, TrendingUp, Award, BarChart3, MessageSquare, Shield, Zap, Search, Home,
};

const DEFAULTS = {
  features: {
    features: [
      { title: 'Property Management', description: 'Navigate the housing market with expert guidance and comprehensive property listings. Manage your entire portfolio from a single dashboard.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=250&fit=crop' },
      { title: 'Smart Search', description: 'Our intelligent search helps you find properties that match your exact requirements. Filter by location, type, price, and more.', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=250&fit=crop' },
      { title: 'Verified Agents', description: 'Connect with verified sellers and agents for seamless property transactions. Every agent is vetted for quality and reliability.', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=250&fit=crop' },
    ],
  },
  platform_features: {
    features: [
      { icon: 'Users', title: 'Realtor Management', description: 'Track performance, commissions, and rankings for all your realtors' },
      { icon: 'Building2', title: 'Property Portfolio', description: 'Manage listings, track appreciation, and handle offers seamlessly' },
      { icon: 'TrendingUp', title: 'Sales Analytics', description: 'Real-time dashboards with comprehensive sales insights' },
      { icon: 'Award', title: 'Loyalty System', description: 'Gamified rewards with tier-based benefits and achievements' },
      { icon: 'BarChart3', title: 'Commission Engine', description: 'Automated commission calculation with tax reporting' },
      { icon: 'MessageSquare', title: 'Real-time Chat', description: 'Built-in messaging between admins, realtors, and clients' },
      { icon: 'Shield', title: 'Role-Based Access', description: 'Secure access control for all user types' },
      { icon: 'Zap', title: 'AI Insights', description: 'Property price prediction and market trend analysis' },
    ],
  },
};

export default function FeaturesPage() {
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

  const features = { ...DEFAULTS.features, ...cms.features };
  const platformFeatures = { ...DEFAULTS.platform_features, ...cms.platform_features };

  return (
    <div className="min-h-screen bg-white dark:bg-primary-950">
      <PublicNavbar currentPage="/features" branding={cms.branding} />

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary via-primary-600 to-primary pt-28 pb-16 px-4">
        <div className="container mx-auto text-center">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">Platform Features</span>
          <h1 className="text-3xl md:text-5xl font-bold text-white mt-3 mb-4">Powerful Features for Modern Real Estate</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">Comprehensive tools designed for property seekers, realtors, and administrators</p>
        </div>
      </section>

      {/* Main 3 Features */}
      <section className="py-20 px-4 bg-white dark:bg-primary-950">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Core Features</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">Search Properties with Ease</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Powerful features designed for modern real estate professionals and property seekers</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(features.features || []).map((feature: any, index: number) => (
              <div key={index} className="group bg-white dark:bg-primary-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-primary-800">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={feature.image?.startsWith('http') ? feature.image : getImageUrl(feature.image || '')}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-accent transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="py-20 px-4 bg-primary dark:bg-primary-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-white">Everything You Need to Succeed</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">Comprehensive tools for managing your real estate business</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(platformFeatures.features || []).map((feature: any, index: number) => {
              const FeatureIcon = ICON_MAP[feature.icon] || Zap;
              return (
                <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all">
                    <FeatureIcon className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categorized Features */}
      <section className="py-20 px-4 bg-white dark:bg-primary-950">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">For Everyone</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">Built for Every User</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Whether you&apos;re searching for a property, selling one, or managing the platform</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-primary-900 rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Home className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">For Property Seekers</h3>
              <div className="space-y-4">
                {[
                  { icon: Search, text: 'Advanced search filters' },
                  { icon: Heart, text: 'Save favorite properties' },
                  { icon: Calendar, text: 'Schedule viewings' },
                  { icon: Eye, text: 'Virtual tours' },
                  { icon: Calculator, text: 'Price comparison tools' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-primary-900 rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <UserCheck className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">For Realtors</h3>
              <div className="space-y-4">
                {[
                  { icon: UsersRound, text: 'Lead management' },
                  { icon: LineChart, text: 'Performance tracking' },
                  { icon: BarChart3, text: 'Commission transparency' },
                  { icon: HeartHandshake, text: 'Client management' },
                  { icon: Award, text: 'Loyalty rewards & tiers' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-primary-900 rounded-2xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Settings className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">For Administrators</h3>
              <div className="space-y-4">
                {[
                  { icon: Users, text: 'Multi-user management' },
                  { icon: FileText, text: 'Financial reporting' },
                  { icon: Lock, text: 'Compliance tools' },
                  { icon: Settings, text: 'Customizable workflows' },
                  { icon: Shield, text: 'Advanced security controls' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary via-primary-600 to-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Experience These Features?</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">Join thousands of users who are already leveraging our platform</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-accent hover:bg-accent-600 text-white shadow-accent text-lg px-8">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/properties">
              <Button size="lg" variant="outline" className="text-white border-white/40 hover:bg-white/10 text-lg px-8">
                Browse Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter cmsData={cms.footer} branding={cms.branding} />
    </div>
  );
}
