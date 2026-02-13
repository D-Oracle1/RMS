'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, Send, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications, CalloutData } from '@/contexts/notification-context';
import { getImageUrl } from '@/lib/api';

const QUICK_RESPONSES = [
  'On my way',
  'Be there in 5 minutes',
  'Busy right now',
  'Acknowledged',
];

export function CalloutAlertModal() {
  const { pendingCallout, showCalloutModal, respondToCallout, dismissCalloutModal } = useNotifications();
  const [customResponse, setCustomResponse] = useState('');
  const [responding, setResponding] = useState(false);

  if (!showCalloutModal || !pendingCallout) return null;

  const handleRespond = async (response: string) => {
    if (!response.trim()) return;
    setResponding(true);
    try {
      await respondToCallout(pendingCallout.calloutId, response);
      setCustomResponse('');
    } finally {
      setResponding(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [0.5, 1.05, 1],
            opacity: 1,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        >
          {/* Animated header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center text-white relative overflow-hidden">
            <motion.div
              animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
              className="inline-block mb-3"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <BellRing className="w-8 h-8" />
              </div>
            </motion.div>
            <h2 className="text-xl font-bold">You&apos;re Being Called</h2>
            <p className="text-white/80 text-sm mt-1">Someone needs your attention</p>
          </div>

          {/* Caller info */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Avatar className="w-14 h-14">
                {pendingCallout.callerAvatar && (
                  <AvatarImage src={getImageUrl(pendingCallout.callerAvatar)} />
                )}
                <AvatarFallback className="bg-primary text-white text-lg">
                  {pendingCallout.callerName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{pendingCallout.callerName}</p>
                {(pendingCallout.callerPosition || pendingCallout.callerDepartment) && (
                  <p className="text-sm text-muted-foreground">
                    {pendingCallout.callerPosition}
                    {pendingCallout.callerPosition && pendingCallout.callerDepartment && ' • '}
                    {pendingCallout.callerDepartment}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(pendingCallout.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {pendingCallout.message && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  &ldquo;{pendingCallout.message}&rdquo;
                </p>
              </div>
            )}

            {/* Quick responses */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Quick Response</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_RESPONSES.map((response) => (
                  <Button
                    key={response}
                    variant="outline"
                    className="text-sm h-auto py-2 px-3"
                    disabled={responding}
                    onClick={() => handleRespond(response)}
                  >
                    {response}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom response */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a custom response..."
                value={customResponse}
                onChange={(e) => setCustomResponse(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && customResponse.trim()) handleRespond(customResponse); }}
                disabled={responding}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={() => handleRespond(customResponse)}
                disabled={responding || !customResponse.trim()}
              >
                {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
