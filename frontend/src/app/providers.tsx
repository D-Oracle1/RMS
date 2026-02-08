'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { PusherProvider } from '@/contexts/pusher-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { ChatProvider } from '@/contexts/chat-context';
import { CallProvider } from '@/contexts/call-context';
import { IncomingCallModal } from '@/components/call/incoming-call-modal';
import { ActiveCallScreen } from '@/components/call/active-call-screen';
import { CalloutAlertModal } from '@/components/callout/callout-alert-modal';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <PusherProvider>
          <NotificationProvider>
            <ChatProvider>
              <CallProvider>
                {children}
                <IncomingCallModal />
                <ActiveCallScreen />
                <CalloutAlertModal />
              </CallProvider>
            </ChatProvider>
          </NotificationProvider>
        </PusherProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
