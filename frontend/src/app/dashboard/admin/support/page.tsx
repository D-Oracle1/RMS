'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Loader2, Search, User, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api, getImageUrl } from '@/lib/api';
import { getUser } from '@/lib/auth-storage';

interface SupportRoom {
  id: string;
  name: string;
  type: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    sender?: { firstName: string; lastName: string };
  };
  messageCount: number;
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  }[];
  lastMessageAt?: string;
}

interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  sender?: { id: string; firstName: string; lastName: string; avatar?: string };
  createdAt: string;
}

export default function AdminSupportPage() {
  const [rooms, setRooms] = useState<SupportRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<SupportRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const user = getUser();
    if (user?.id) setCurrentUserId(user.id);
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const res: any = await api.get('/chat/support/rooms');
      const data = Array.isArray(res) ? res : res?.data || [];
      setRooms(data);
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const res: any = await api.get(`/chat/rooms/${roomId}/messages?limit=100`);
      setMessages(res?.data || []);
    } catch {
      // silent
    }
  }, []);

  const selectRoom = useCallback(async (room: SupportRoom) => {
    setSelectedRoom(room);
    setShowMobileChat(true);
    setLoadingMessages(true);
    await fetchMessages(room.id);
    setLoadingMessages(false);
    // Mark as read
    try {
      await api.post(`/chat/rooms/${room.id}/read`);
    } catch {
      // silent
    }
  }, [fetchMessages]);

  // Poll for new messages in selected room
  useEffect(() => {
    if (selectedRoom) {
      pollRef.current = setInterval(() => {
        fetchMessages(selectedRoom.id);
        fetchRooms();
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedRoom, fetchMessages, fetchRooms]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const res: any = await api.post(`/chat/rooms/${selectedRoom.id}/messages`, { content });
      const msg = res?.data || res;
      setMessages((prev) => [...prev, msg]);
    } catch {
      toast.error('Failed to send message');
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get the non-admin user from room participants (the customer)
  const getCustomer = (room: SupportRoom) => {
    return room.participants.find((p) => p.role !== 'ADMIN' && p.role !== 'SUPER_ADMIN' && p.role !== 'GENERAL_OVERSEER');
  };

  const filteredRooms = search
    ? rooms.filter((r) => {
        const customer = getCustomer(r);
        const name = customer ? `${customer.firstName} ${customer.lastName}` : r.name;
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : rooms;

  return (
    <div className="h-[calc(100dvh-5rem)] md:h-[calc(100dvh-5.5rem)] overflow-hidden">
      <Card className="h-full shadow-sm overflow-hidden">
        <div className="flex h-full">
          {/* Room List */}
          <div className={cn(
            'w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col',
            showMobileChat && 'hidden md:flex'
          )}>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-[#0b5c46] text-white">
              <h2 className="font-semibold text-sm">Support Chats</h2>
            </div>
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingRooms ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredRooms.length > 0 ? (
                filteredRooms.map((room) => {
                  const customer = getCustomer(room);
                  const isActive = selectedRoom?.id === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => selectRoom(room)}
                      className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        isActive ? 'bg-[#0b5c46]/5 border-l-2 border-l-[#0b5c46]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          {customer?.avatar && (
                            <AvatarImage src={getImageUrl(customer.avatar)} />
                          )}
                          <AvatarFallback className="bg-[#0b5c46]/10 text-[#0b5c46] text-sm">
                            {customer ? `${customer.firstName[0]}${customer.lastName[0]}` : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {customer ? `${customer.firstName} ${customer.lastName}` : room.name}
                            </p>
                            {room.lastMessage && (
                              <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                                {new Date(room.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500 truncate flex-1">
                              {room.lastMessage?.content || 'No messages yet'}
                            </p>
                            {customer && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                {customer.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No support chats yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className={cn(
            'flex-1 flex flex-col',
            !showMobileChat && 'hidden md:flex'
          )}>
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 shrink-0 bg-[#0b5c46] text-white">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-white hover:bg-white/20"
                    onClick={() => { setShowMobileChat(false); setSelectedRoom(null); }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  {(() => {
                    const customer = getCustomer(selectedRoom);
                    return (
                      <>
                        <Avatar className="w-9 h-9">
                          {customer?.avatar && (
                            <AvatarImage src={getImageUrl(customer.avatar)} />
                          )}
                          <AvatarFallback className="bg-white/20 text-white text-sm">
                            {customer ? `${customer.firstName[0]}${customer.lastName[0]}` : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {customer ? `${customer.firstName} ${customer.lastName}` : selectedRoom.name}
                          </p>
                          <p className="text-xs text-white/70">
                            {customer?.role || 'Support Chat'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isOwn = msg.senderId === currentUserId;
                        const isSystem = msg.type === 'SYSTEM';
                        if (isSystem) {
                          return (
                            <div key={msg.id} className="text-center">
                              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                                {msg.content}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                                isOwn
                                  ? 'bg-[#0b5c46] text-white rounded-br-md'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                              }`}
                            >
                              {!isOwn && msg.sender && (
                                <p className="text-xs font-medium text-[#0b5c46] dark:text-[#14956e] mb-0.5">
                                  {msg.sender.firstName} {msg.sender.lastName}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your reply..."
                      className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0b5c46]/30 border-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="w-10 h-10 rounded-full bg-[#0b5c46] text-white flex items-center justify-center hover:bg-[#094a38] disabled:opacity-40 transition-colors shrink-0"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* No room selected */
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose a support chat from the list to respond</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
