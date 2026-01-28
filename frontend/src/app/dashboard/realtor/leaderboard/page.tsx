'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, getTierBgClass } from '@/lib/utils';

type TimePeriod = 'month' | 'year' | 'all';

const leaderboardData = {
  month: [
    { rank: 1, name: 'Adaeze Okonkwo', tier: 'PLATINUM', sales: 8, totalValue: 450000000, commission: 18000000, change: 0, avatar: null },
    { rank: 2, name: 'Chinedu Eze', tier: 'GOLD', sales: 7, totalValue: 380000000, commission: 15200000, change: 1, avatar: null },
    { rank: 3, name: 'Funke Adeyemi', tier: 'GOLD', sales: 6, totalValue: 320000000, commission: 12800000, change: -1, avatar: null },
    { rank: 4, name: 'Emeka Nwankwo', tier: 'SILVER', sales: 5, totalValue: 280000000, commission: 11200000, change: 2, avatar: null },
    { rank: 5, name: 'Ngozi Obi', tier: 'SILVER', sales: 5, totalValue: 250000000, commission: 10000000, change: 0, avatar: null },
    { rank: 6, name: 'Tunde Bakare', tier: 'BRONZE', sales: 4, totalValue: 180000000, commission: 7200000, change: -2, avatar: null },
    { rank: 7, name: 'Fatima Ibrahim', tier: 'BRONZE', sales: 3, totalValue: 120000000, commission: 4800000, change: 1, avatar: null },
    { rank: 8, name: 'Your Name', tier: 'GOLD', sales: 5, totalValue: 285000000, commission: 11400000, change: -1, isCurrentUser: true, avatar: null },
    { rank: 9, name: 'Kola Adesanya', tier: 'BRONZE', sales: 2, totalValue: 85000000, commission: 3400000, change: 3, avatar: null },
    { rank: 10, name: 'Amina Hassan', tier: 'BRONZE', sales: 2, totalValue: 72000000, commission: 2880000, change: -1, avatar: null },
  ],
  year: [
    { rank: 1, name: 'Adaeze Okonkwo', tier: 'PLATINUM', sales: 45, totalValue: 1250000000, commission: 50000000, change: 0, avatar: null },
    { rank: 2, name: 'Chinedu Eze', tier: 'GOLD', sales: 38, totalValue: 980000000, commission: 39200000, change: 1, avatar: null },
    { rank: 3, name: 'Funke Adeyemi', tier: 'GOLD', sales: 35, totalValue: 820000000, commission: 32800000, change: -1, avatar: null },
    { rank: 4, name: 'Emeka Nwankwo', tier: 'SILVER', sales: 33, totalValue: 750000000, commission: 26250000, change: 2, avatar: null },
    { rank: 5, name: 'Ngozi Obi', tier: 'SILVER', sales: 32, totalValue: 710000000, commission: 24850000, change: 0, avatar: null },
    { rank: 6, name: 'Tunde Bakare', tier: 'SILVER', sales: 30, totalValue: 650000000, commission: 22750000, change: -2, avatar: null },
    { rank: 7, name: 'Fatima Ibrahim', tier: 'BRONZE', sales: 28, totalValue: 590000000, commission: 17700000, change: 1, avatar: null },
    { rank: 8, name: 'Your Name', tier: 'GOLD', sales: 32, totalValue: 720000000, commission: 28800000, change: -1, isCurrentUser: true, avatar: null },
    { rank: 9, name: 'Kola Adesanya', tier: 'BRONZE', sales: 25, totalValue: 520000000, commission: 15600000, change: 3, avatar: null },
    { rank: 10, name: 'Amina Hassan', tier: 'BRONZE', sales: 22, totalValue: 460000000, commission: 13800000, change: -1, avatar: null },
  ],
  all: [
    { rank: 1, name: 'Adaeze Okonkwo', tier: 'PLATINUM', sales: 125, totalValue: 3250000000, commission: 130000000, change: 0, avatar: null },
    { rank: 2, name: 'Chinedu Eze', tier: 'GOLD', sales: 98, totalValue: 2580000000, commission: 103200000, change: 1, avatar: null },
    { rank: 3, name: 'Funke Adeyemi', tier: 'GOLD', sales: 95, totalValue: 2420000000, commission: 96800000, change: -1, avatar: null },
    { rank: 4, name: 'Emeka Nwankwo', tier: 'SILVER', sales: 88, totalValue: 2150000000, commission: 75250000, change: 2, avatar: null },
    { rank: 5, name: 'Ngozi Obi', tier: 'SILVER', sales: 82, totalValue: 1910000000, commission: 66850000, change: 0, avatar: null },
    { rank: 6, name: 'Tunde Bakare', tier: 'SILVER', sales: 78, totalValue: 1750000000, commission: 61250000, change: -2, avatar: null },
    { rank: 7, name: 'Fatima Ibrahim', tier: 'BRONZE', sales: 72, totalValue: 1590000000, commission: 47700000, change: 1, avatar: null },
    { rank: 8, name: 'Your Name', tier: 'GOLD', sales: 75, totalValue: 1820000000, commission: 72800000, change: -1, isCurrentUser: true, avatar: null },
    { rank: 9, name: 'Kola Adesanya', tier: 'BRONZE', sales: 65, totalValue: 1320000000, commission: 39600000, change: 3, avatar: null },
    { rank: 10, name: 'Amina Hassan', tier: 'BRONZE', sales: 58, totalValue: 1160000000, commission: 34800000, change: -1, avatar: null },
  ],
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
  return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
};

export default function RealtorLeaderboardPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');

  const leaderboard = leaderboardData[timePeriod];
  const currentUser = leaderboard.find(r => r.isCurrentUser);

  const myStats = useMemo(() => {
    if (!currentUser) return null;
    const previousRank = currentUser.rank + currentUser.change;
    return {
      rank: currentUser.rank,
      previousRank,
      sales: currentUser.sales,
      totalValue: currentUser.totalValue,
      percentile: `Top ${Math.ceil((currentUser.rank / leaderboard.length) * 100)}%`,
    };
  }, [currentUser, leaderboard]);

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  return (
    <div className="space-y-6">
      {/* My Position */}
      {myStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-primary to-primary-600 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Your Leaderboard Position</h2>
                  <p className="text-white/80">Keep pushing! You're in the {myStats.percentile} of all realtors.</p>
                </div>
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-4xl font-bold">#{myStats.rank}</p>
                    <p className="text-sm text-white/80">Current Rank</p>
                    {myStats.rank > myStats.previousRank ? (
                      <p className="text-xs text-red-300">↓ Down from #{myStats.previousRank}</p>
                    ) : myStats.rank < myStats.previousRank ? (
                      <p className="text-xs text-green-300">↑ Up from #{myStats.previousRank}</p>
                    ) : (
                      <p className="text-xs text-white/60">No change</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">{myStats.sales}</p>
                    <p className="text-sm text-white/80">Total Sales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold">{formatCurrency(myStats.totalValue)}</p>
                    <p className="text-sm text-white/80">Total Value</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Sales Leaderboard
              <Badge variant="outline" className="ml-2">{getTimePeriodLabel()}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={timePeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('month')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                This Month
              </Button>
              <Button
                variant={timePeriod === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('year')}
              >
                This Year
              </Button>
              <Button
                variant={timePeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('all')}
              >
                All Time
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((realtor, index) => (
                <motion.div
                  key={`${realtor.rank}-${realtor.name}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    realtor.isCurrentUser
                      ? 'bg-primary/10 border-2 border-primary'
                      : realtor.rank <= 3
                      ? 'bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/10'
                      : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="w-10 flex justify-center">
                    {getRankIcon(realtor.rank)}
                  </div>
                  <Avatar>
                    {realtor.avatar && <AvatarImage src={realtor.avatar} alt={realtor.name} />}
                    <AvatarFallback className={realtor.isCurrentUser ? 'bg-primary text-white' : 'bg-gray-200'}>
                      {realtor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">
                        {realtor.name}
                        {realtor.isCurrentUser && <span className="text-primary ml-2">(You)</span>}
                      </p>
                      <Badge className={getTierBgClass(realtor.tier)}>{realtor.tier}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{realtor.sales} sales</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-semibold">{formatCurrency(realtor.totalValue)}</p>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                  </div>
                  <div className="text-right w-24 hidden md:block">
                    <p className="font-semibold text-primary">{formatCurrency(realtor.commission)}</p>
                    <p className="text-sm text-muted-foreground">Commission</p>
                  </div>
                  <div className="w-12 text-center">
                    {realtor.change !== 0 && (
                      <span className={`text-sm font-medium ${realtor.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {realtor.change > 0 ? '↑' : '↓'} {Math.abs(realtor.change)}
                      </span>
                    )}
                    {realtor.change === 0 && (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
