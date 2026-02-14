'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Pusher, { Channel, PresenceChannel } from 'pusher-js';
import { getToken, getUser } from '@/lib/auth-storage';

interface PusherContextValue {
  pusher: Pusher | null;
  isConnected: boolean;
  onlineUsers: string[];
  userChannel: Channel | null;
}

const PusherContext = createContext<PusherContextValue>({
  pusher: null,
  isConnected: false,
  onlineUsers: [],
  userChannel: null,
});

export function PusherProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [pusherInstance, setPusherInstance] = useState<Pusher | null>(null);
  const [userChannel, setUserChannel] = useState<Channel | null>(null);
  const presenceChannelRef = useRef<PresenceChannel | null>(null);
  const mountedRef = useRef(true);

  const initPusher = () => {
    const token = getToken();
    const user = getUser();
    if (!token || token === 'demo-token' || !user) return;

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      channelAuthorization: {
        endpoint: `${apiUrl}/api/v1/pusher/auth`,
        transport: 'ajax',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    setPusherInstance(pusher);

    pusher.connection.bind('connected', () => {
      if (mountedRef.current) setIsConnected(true);
    });

    pusher.connection.bind('disconnected', () => {
      if (mountedRef.current) setIsConnected(false);
    });

    pusher.connection.bind('error', () => {
      if (mountedRef.current) setIsConnected(false);
    });

    // Subscribe to personal channel for notifications, calls, etc.
    const channel = pusher.subscribe(`private-user-${user.id}`);
    setUserChannel(channel);

    // Subscribe to role-based channel
    if (user.role) {
      pusher.subscribe(`private-role-${user.role}`);
    }

    // Subscribe to presence channel for online tracking
    const presenceChannel = pusher.subscribe('presence-online') as PresenceChannel;
    presenceChannelRef.current = presenceChannel;

    presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
      if (!mountedRef.current) return;
      const ids: string[] = [];
      members.each((member: { id: string }) => ids.push(member.id));
      setOnlineUsers(ids);
    });

    presenceChannel.bind('pusher:member_added', (member: { id: string }) => {
      if (!mountedRef.current) return;
      setOnlineUsers((prev) => (prev.includes(member.id) ? prev : [...prev, member.id]));
    });

    presenceChannel.bind('pusher:member_removed', (member: { id: string }) => {
      if (!mountedRef.current) return;
      setOnlineUsers((prev) => prev.filter((id) => id !== member.id));
    });
  };

  const cleanupPusher = () => {
    setPusherInstance((prev) => {
      if (prev) prev.disconnect();
      return null;
    });
    setUserChannel(null);
    presenceChannelRef.current = null;
  };

  useEffect(() => {
    mountedRef.current = true;
    initPusher();

    return () => {
      mountedRef.current = false;
      cleanupPusher();
    };
  }, []);

  // Reconnect when user changes
  useEffect(() => {
    const handleUserUpdated = () => {
      cleanupPusher();
      initPusher();
    };

    window.addEventListener('user-updated', handleUserUpdated);
    return () => window.removeEventListener('user-updated', handleUserUpdated);
  }, []);

  return (
    <PusherContext.Provider
      value={{
        pusher: pusherInstance,
        isConnected,
        onlineUsers,
        userChannel,
      }}
    >
      {children}
    </PusherContext.Provider>
  );
}

export function usePusher() {
  return useContext(PusherContext);
}

/** Backward-compatible alias — components using useSocket() get the same shape */
export function useSocket() {
  const { pusher, isConnected, onlineUsers } = useContext(PusherContext);
  return { socket: pusher, isConnected, onlineUsers };
}
