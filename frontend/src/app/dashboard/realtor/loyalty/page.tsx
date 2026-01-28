'use client';

import { motion } from 'framer-motion';
import {
  Award,
  Star,
  TrendingUp,
  Gift,
  Crown,
  Zap,
  Target,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getTierBgClass } from '@/lib/utils';

const loyaltyData = {
  currentTier: 'GOLD',
  points: 12500,
  nextTier: 'PLATINUM',
  pointsToNext: 37500,
  multiplier: 1.5,
  commissionRate: 4.0,
};

const tierBenefits = {
  BRONZE: { rate: 3.0, multiplier: 1.0, benefits: ['Basic Support', 'Standard Listings'] },
  SILVER: { rate: 3.5, multiplier: 1.25, benefits: ['Priority Support', 'Featured Listings', 'Monthly Reports'] },
  GOLD: { rate: 4.0, multiplier: 1.5, benefits: ['Premium Support', 'Premium Listings', 'Weekly Reports', 'Marketing Tools'] },
  PLATINUM: { rate: 4.0, multiplier: 2.0, benefits: ['VIP Support', 'VIP Listings', 'Real-time Analytics', 'Premium Marketing', 'Personal Account Manager'] },
};

const pointsHistory = [
  { id: 1, description: 'Sale: Modern Villa in Beverly Hills', points: 2850, date: '2024-01-20' },
  { id: 2, description: 'Sale: Downtown Luxury Loft', points: 750, date: '2024-01-18' },
  { id: 3, description: 'Bonus: 5 Sales Milestone', points: 500, date: '2024-01-15' },
  { id: 4, description: 'Sale: Suburban Family Home', points: 485, date: '2024-01-12' },
  { id: 5, description: 'Sale: Mountain View Retreat', points: 620, date: '2024-01-10' },
];

const milestones = [
  { id: 1, title: 'First Sale', points: 100, completed: true },
  { id: 2, title: '5 Sales', points: 500, completed: true },
  { id: 3, title: '10 Sales', points: 1000, completed: true },
  { id: 4, title: '25 Sales', points: 2500, completed: true },
  { id: 5, title: '50 Sales', points: 5000, completed: false },
  { id: 6, title: '100 Sales', points: 10000, completed: false },
];

const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

export default function RealtorLoyaltyPage() {
  const progressToNextTier = ((loyaltyData.points) / (loyaltyData.points + loyaltyData.pointsToNext)) * 100;
  const currentTierIndex = tiers.indexOf(loyaltyData.currentTier);

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-12 h-12" />
                  <div>
                    <h2 className="text-3xl font-bold">{loyaltyData.currentTier} Member</h2>
                    <p className="text-white/80">Loyalty Program Status</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-4xl font-bold">{loyaltyData.points.toLocaleString()}</p>
                    <p className="text-sm text-white/80">Total Points</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">{loyaltyData.multiplier}x</p>
                    <p className="text-sm text-white/80">Points Multiplier</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">{loyaltyData.commissionRate}%</p>
                    <p className="text-sm text-white/80">Commission Rate</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 rounded-xl p-6 min-w-64">
                <p className="text-sm mb-2">Progress to {loyaltyData.nextTier}</p>
                <Progress value={progressToNextTier} className="h-3 bg-white/30" />
                <p className="text-sm mt-2">{loyaltyData.pointsToNext.toLocaleString()} points to go</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tier Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Tier Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {tiers.map((tier, index) => (
                  <div
                    key={tier}
                    className={`p-4 rounded-xl border-2 ${
                      tier === loyaltyData.currentTier
                        ? 'border-primary bg-primary/5'
                        : index < currentTierIndex
                        ? 'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
                        : 'border-gray-200 opacity-60'
                    }`}
                  >
                    <Badge className={`${getTierBgClass(tier)} mb-3`}>{tier}</Badge>
                    <p className="text-2xl font-bold mb-1">{tierBenefits[tier as keyof typeof tierBenefits].rate}%</p>
                    <p className="text-sm text-muted-foreground mb-3">Commission Rate</p>
                    <ul className="space-y-2">
                      {tierBenefits[tier as keyof typeof tierBenefits].benefits.map((benefit, i) => (
                        <li key={i} className="text-xs flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      milestone.completed
                        ? 'bg-green-50 dark:bg-green-900/10'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {milestone.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={milestone.completed ? 'font-medium' : 'text-muted-foreground'}>
                        {milestone.title}
                      </span>
                    </div>
                    <Badge variant={milestone.completed ? 'success' : 'outline'}>
                      +{milestone.points}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Points History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Points History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pointsHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <Badge variant="success">+{item.points} pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
