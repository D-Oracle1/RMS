'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCall } from '@/contexts/call-context';
import { getImageUrl } from '@/lib/api';

export function IncomingCallModal() {
  const { callStatus, callType, peerInfo, acceptCall, rejectCall } = useCall();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (callStatus === 'incoming') {
      // Auto-reject after 30 seconds
      timeoutRef.current = setTimeout(() => {
        rejectCall();
      }, 30000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [callStatus, rejectCall]);

  if (callStatus !== 'incoming' || !peerInfo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
        >
          {/* Animated rings */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-green-500/30"
            />
            <motion.div
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              className="absolute inset-0 rounded-full bg-green-500/30"
            />
            <Avatar className="w-24 h-24 relative z-10">
              {peerInfo.avatar && <AvatarImage src={getImageUrl(peerInfo.avatar)} />}
              <AvatarFallback className="bg-primary text-white text-2xl">
                {peerInfo.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <h2 className="text-xl font-bold mb-1">{peerInfo.name}</h2>
          <p className="text-muted-foreground mb-8">
            Incoming {callType === 'video' ? 'video' : 'voice'} call...
          </p>

          <div className="flex items-center justify-center gap-6">
            <Button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
              size="icon"
            >
              <PhoneOff className="w-7 h-7" />
            </Button>
            <Button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white"
              size="icon"
            >
              {callType === 'video' ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
