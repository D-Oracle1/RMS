import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  TrendingUp,
  Shield,
  BarChart3,
  MessageSquare,
  Award,
  Zap
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">RMS Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-primary hover:bg-primary-600">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Enterprise-Grade PropTech Solution
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Realtors Management
            <br />
            <span className="text-primary">System</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            A comprehensive platform for managing realtors, tracking sales,
            commissions, and building a thriving real estate business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-primary hover:bg-primary-600 text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powerful features designed for modern real estate professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: 'Realtor Management',
                description: 'Track performance, commissions, and rankings for all your realtors',
              },
              {
                icon: Building2,
                title: 'Property Portfolio',
                description: 'Manage listings, track appreciation, and handle offers seamlessly',
              },
              {
                icon: TrendingUp,
                title: 'Sales Analytics',
                description: 'Real-time dashboards with comprehensive sales insights',
              },
              {
                icon: Award,
                title: 'Loyalty System',
                description: 'Gamified rewards with tier-based benefits and achievements',
              },
              {
                icon: BarChart3,
                title: 'Commission Engine',
                description: 'Automated commission calculation with tax reporting',
              },
              {
                icon: MessageSquare,
                title: 'Real-time Chat',
                description: 'Built-in messaging between admins, realtors, and clients',
              },
              {
                icon: Shield,
                title: 'Role-Based Access',
                description: 'Secure access control for Super Admin, Admin, Realtor, and Client',
              },
              {
                icon: Zap,
                title: 'AI Insights',
                description: 'Property price prediction and market trend analysis',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 hover:shadow-glass-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-8 md:p-12">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { value: '10K+', label: 'Properties Managed' },
                { value: '₦500B+', label: 'Total Sales Volume' },
                { value: '2,500+', label: 'Active Realtors' },
                { value: '99.9%', label: 'Uptime SLA' },
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Join thousands of successful real estate professionals using RMS Platform
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-primary">RMS Platform</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} RMS Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
