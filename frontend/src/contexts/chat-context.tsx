'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth-storage';
import { usePusher } from './pusher-context';

export interface ChatParticipant {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  sender: ChatParticipant;
  content: string;
  type: string;
  attachments: any;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  id: string;
  name: string | null;
  type: 'DIRECT' | 'GROUP';
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

interface TypingUser {
  userId: string;
  roomId: string;
}

interface ChatContextValue {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  typingUsers: TypingUser[];
  fetchRooms: () => Promise<void>;
  selectRoom: (room: ChatRoom) => Promise<void>;
  sendMessage: (content: string, type?: string) => Promise<void>;
  createRoom: (participantIds: string[], name?: string) => Promise<ChatRoom>;
  sendTyping: (isTyping: boolean) => void;
  setActiveRoom: (room: ChatRoom | null) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { pusher, userChannel } = usePusher();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const activeRoomRef = useRef<string | null>(null);
  const chatChannelRef = useRef<any>(null);

  const isDemo = () => getToken() === 'demo-token';

  const fetchRooms = useCallback(async () => {
    const token = getToken();
    if (!token || isDemo()) return;

    setIsLoadingRooms(true);
    try {
      const data = await api.get<ChatRoom[]>('/chat/rooms');
      const roomsList = Array.isArray(data) ? data : (data as any)?.data || [];
      setRooms(roomsList);
    } catch {
      // silently fail
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  const selectRoom = useCallback(async (room: ChatRoom) => {
    // Unsubscribe from previous chat channel
    if (activeRoomRef.current && pusher) {
      pusher.unsubscribe(`presence-chat-${activeRoomRef.current}`);
      chatChannelRef.current = null;
    }

    setActiveRoom(room);
    activeRoomRef.current = room.id;
    setMessages([]);
    setIsLoadingMessages(true);

    // Subscribe to new chat room's presence channel
    if (pusher) {
      const channel = pusher.subscribe(`presence-chat-${room.id}`);
      chatChannelRef.current = channel;

      // Listen for typing via client events
      channel.bind('client-typing', (data: { userId: string; isTyping: boolean }) => {
        if (data.isTyping) {
          setTypingUsers((prev) => {
            if (prev.some((t) => t.userId === data.userId && t.roomId === room.id)) return prev;
            return [...prev, { userId: data.userId, roomId: room.id }];
          });
          setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((t) => !(t.userId === data.userId && t.roomId === room.id)),
            );
          }, 3000);
        } else {
          setTypingUsers((prev) =>
            prev.filter((t) => !(t.userId === data.userId && t.roomId === room.id)),
          );
        }
      });
    }

    try {
      const res = await api.get<{ data: ChatMessage[] }>(`/chat/rooms/${room.id}/messages?limit=100`);
      const msgs = Array.isArray(res) ? res : res.data || [];
      setMessages(msgs);

      await api.post(`/chat/rooms/${room.id}/read`);
      setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r)));
    } catch {
      // silently fail
    } finally {
      setIsLoadingMessages(false);
    }
  }, [pusher]);

  const sendMessage = useCallback(async (content: string, type = 'TEXT') => {
    if (!activeRoomRef.current || !content.trim()) return;

    try {
      const message = await api.post<ChatMessage>(`/chat/rooms/${activeRoomRef.current}/messages`, {
        content: content.trim(),
        type,
      });
      const msg = (message as any)?.data || message;
      setMessages((prev) => [...prev, msg]);

      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === activeRoomRef.current) {
            return { ...r, lastMessage: msg, lastMessageAt: msg.createdAt };
          }
          return r;
        }),
      );
    } catch {
      throw new Error('Failed to send message');
    }
  }, []);

  const createRoom = useCallback(async (participantIds: string[], name?: string) => {
    const room = await api.post<ChatRoom>('/chat/rooms', { participantIds, name });
    const newRoom = (room as any)?.data || room;
    setRooms((prev) => [newRoom, ...prev]);
    return newRoom;
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!chatChannelRef.current) return;
    // Use Pusher client events for typing (no server round-trip)
    chatChannelRef.current.trigger('client-typing', { isTyping });
  }, []);

  // Listen for chat messages on the user's private channel
  useEffect(() => {
    if (!userChannel) return;

    const handleNewMessage = (data: { roomId: string; message: ChatMessage }) => {
      if (data.roomId === activeRoomRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        api.post(`/chat/rooms/${data.roomId}/read`).catch(() => {});
      } else {
        setRooms((prev) =>
          prev.map((r) => {
            if (r.id === data.roomId) {
              return {
                ...r,
                unreadCount: r.unreadCount + 1,
                lastMessage: data.message,
                lastMessageAt: data.message.createdAt,
              };
            }
            return r;
          }),
        );
      }
    };

    userChannel.bind('chat:message', handleNewMessage);
    return () => {
      userChannel.unbind('chat:message', handleNewMessage);
    };
  }, [userChannel]);

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoom,
        messages,
        isLoadingRooms,
        isLoadingMessages,
        typingUsers,
        fetchRooms,
        selectRoom,
        sendMessage,
        createRoom,
        sendTyping,
        setActiveRoom,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return ctx;
}
