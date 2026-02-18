'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { PusherProvider } from '@/contexts/pusher-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { ChatProvider } from '@/contexts/chat-context';
import { CallProvider } from '@/contexts/call-context';
import { requestNotificationPermission } from '@/lib/push-notifications';

const IncomingCallModal = dynamic(
  () => import('@/components/call/incoming-call-modal').then((m) => m.IncomingCallModal),
  { ssr: false },
);
const ActiveCallScreen = dynamic(
  () => import('@/components/call/active-call-screen').then((m) => m.ActiveCallScreen),
  { ssr: false },
);
const CalloutAlertModal = dynamic(
  () => import('@/components/callout/callout-alert-modal').then((m) => m.CalloutAlertModal),
  { ssr: false },
);

function PushNotificationSetup() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Request push notification permission after a short delay
    const timer = setTimeout(() => {
      requestNotificationPermission();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return null;
}

export function AuthenticatedProviders({ children }: { children: React.ReactNode }) {
  return (
    <PusherProvider>
      <NotificationProvider>
        <ChatProvider>
          <CallProvider>
            {children}
            <IncomingCallModal />
            <ActiveCallScreen />
            <CalloutAlertModal />
            <PushNotificationSetup />
          </CallProvider>
        </ChatProvider>
      </NotificationProvider>
    </PusherProvider>
  );
}
