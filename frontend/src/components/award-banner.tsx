'use client';

import { useState, useEffect } from 'react';
import { Trophy, X, Star } from 'lucide-react';
import { api } from '@/lib/api';

const AWARD_LABELS: Record<string, string> = {
  STAFF_OF_MONTH: 'Staff of the Month',
  REALTOR_OF_MONTH: 'Realtor of the Month',
  CLIENT_OF_MONTH: 'Client of the Month',
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Award {
  id: string;
  type: string;
  month: number;
  year: number;
  reason: string;
  publishedAt: string;
}

export function AwardBanner() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    api.get('/awards/my-awards')
      .then((res: any) => {
        const data: Award[] = Array.isArray(res) ? res : (res?.data || []);
        // Show awards from the last 2 months
        const now = new Date();
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const recent = data.filter((a) => new Date(a.publishedAt) >= twoMonthsAgo);
        setAwards(recent);
      })
      .catch(() => {});

    const stored = localStorage.getItem('dismissed-awards');
    if (stored) {
      try { setDismissed(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const handleDismiss = (id: string) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed-awards', JSON.stringify(updated));
  };

  const visibleAwards = awards.filter((a) => !dismissed.includes(a.id));

  if (visibleAwards.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {visibleAwards.map((award) => (
        <div
          key={award.id}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-[2px]"
        >
          <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 rounded-2xl p-5">
            {/* Decorative stars */}
            <div className="absolute top-2 right-12 opacity-20">
              <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
            </div>
            <div className="absolute bottom-2 right-24 opacity-10">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                  Congratulations!
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {AWARD_LABELS[award.type] || award.type}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {MONTH_NAMES[award.month]} {award.year} &mdash; {award.reason}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(award.id)}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-amber-200/50 transition-colors"
              >
                <X className="w-4 h-4 text-amber-700" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
