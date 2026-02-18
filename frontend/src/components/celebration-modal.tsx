'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star, Award, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, getImageUrl } from '@/lib/api';
import { getUser } from '@/lib/auth-storage';


const AWARD_LABELS: Record<string, string> = {
  STAFF_OF_MONTH: 'Staff of the Month',
  REALTOR_OF_MONTH: 'Realtor of the Month',
  CLIENT_OF_MONTH: 'Client of the Month',
};

const AWARD_ICONS: Record<string, typeof Trophy> = {
  STAFF_OF_MONTH: Award,
  REALTOR_OF_MONTH: Crown,
  CLIENT_OF_MONTH: Star,
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface AwardData {
  id: string;
  type: string;
  month: number;
  year: number;
  reason: string;
  publishedAt: string;
}

export function CelebrationModal() {
  const [awards, setAwards] = useState<AwardData[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const confettiFired = useRef(false);

  const fetchAwards = useCallback(async () => {
    try {
      const res: any = await api.get('/awards/my-awards');
      const data: AwardData[] = Array.isArray(res) ? res : (res?.data || []);
      const now = new Date();
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const recent = data.filter(
        (a) => new Date(a.publishedAt) >= twoMonthsAgo
      );
      setAwards(recent);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchAwards();
  }, [fetchAwards]);

  useEffect(() => {
    if (awards.length > 0 && !dismissed && !confettiFired.current) {
      confettiFired.current = true;

      import('canvas-confetti').then(({ default: confetti }) => {
        // Initial big burst
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB'],
            zIndex: 10001,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB'],
            zIndex: 10001,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };

        // Big center burst first
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB', '#FF69B4'],
          zIndex: 10001,
        });

        // Then side streams
        setTimeout(() => requestAnimationFrame(frame), 300);
      });
    }
  }, [awards, dismissed]);

  const user = getUser();
  const userName = user ? `${user.firstName} ${user.lastName}` : '';

  if (awards.length === 0 || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="relative w-full max-w-lg mx-4 overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-md"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Gold gradient header */}
          <div className="relative bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 px-8 pt-10 pb-14 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-3 left-6 opacity-30">
              <Star className="w-8 h-8 fill-white text-white" />
            </div>
            <div className="absolute top-8 right-10 opacity-20">
              <Star className="w-6 h-6 fill-white text-white" />
            </div>
            <div className="absolute bottom-4 left-16 opacity-20">
              <Star className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="absolute bottom-6 right-8 opacity-30">
              <Star className="w-7 h-7 fill-white text-white" />
            </div>

            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2, damping: 10 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4"
            >
              <Trophy className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-extrabold text-white mb-1"
            >
              Congratulations!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-lg font-medium"
            >
              {userName}
            </motion.p>
          </div>

          {/* Awards list */}
          <div className="px-8 -mt-6 pb-8">
            <div className="space-y-4">
              {awards.map((award, index) => {
                const IconComponent = AWARD_ICONS[award.type] || Trophy;
                return (
                  <motion.div
                    key={award.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="relative bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 rounded-2xl p-5 border border-amber-200 dark:border-amber-800 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {AWARD_LABELS[award.type] || award.type}
                        </h3>
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                          {MONTH_NAMES[award.month]} {award.year}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {award.reason}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center"
            >
              <Button
                onClick={() => setDismissed(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-2 rounded-full font-semibold shadow-lg"
              >
                Thank You!
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
