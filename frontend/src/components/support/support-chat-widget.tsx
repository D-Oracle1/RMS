'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getToken, getUser } from '@/lib/auth-storage';
import { api } from '@/lib/api';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  sender?: { id: string; firstName: string; lastName: string; avatar?: string };
  createdAt: string;
}

export function SupportChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check auth state
  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      const user = getUser();
      setIsLoggedIn(!!token && !!user);
      if (user?.id) setUserId(user.id);
    };
    checkAuth();

    // Re-check on storage changes (login/logout in same tab)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Fetch WhatsApp number from CMS branding
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/cms/public/branding`)
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        const data = raw?.data !== undefined ? raw.data : raw;
        if (data?.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch messages for the support room
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      const res: any = await api.get(`/chat/rooms/${roomId}/messages?limit=50`);
      const msgs = res?.data || [];
      setMessages(msgs);
    } catch {
      // silent
    }
  }, [roomId]);

  // Start or get support chat when opening as logged-in user
  const initSupportChat = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.post('/chat/support/start');
      const room = res?.data || res;
      if (room?.id) {
        setRoomId(room.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start support chat');
    } finally {
      setLoading(false);
    }
  }, []);

  // When panel opens and user is logged in, init the support chat
  useEffect(() => {
    if (isOpen && isLoggedIn && !roomId) {
      initSupportChat();
    }
  }, [isOpen, isLoggedIn, roomId, initSupportChat]);

  // Fetch messages when roomId is set
  useEffect(() => {
    if (roomId) {
      fetchMessages().then(scrollToBottom);
    }
  }, [roomId, fetchMessages, scrollToBottom]);

  // Poll for new messages every 5 seconds when chat is open
  useEffect(() => {
    if (isOpen && roomId) {
      pollRef.current = setInterval(() => {
        fetchMessages();
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, roomId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!newMessage.trim() || !roomId || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const res: any = await api.post(`/chat/rooms/${roomId}/messages`, { content });
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

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
    : '';

  // Hide widget on chat pages to avoid blocking the send button
  if (pathname?.includes('/chat') || pathname?.includes('/support')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 w-full h-full md:w-[360px] md:h-[480px] bg-white dark:bg-gray-900 md:rounded-2xl shadow-2xl md:border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 z-50">
          {/* Header */}
          <div className="bg-[#0b5c46] text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">Support Chat</p>
                <p className="text-xs text-white/70">We typically reply within minutes</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          {!isLoggedIn ? (
            /* Not logged in state */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0b5c46]/10 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-[#0b5c46]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Need Help?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Sign in to chat with our support team, or reach us on WhatsApp.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[220px]">
                <Button asChild className="bg-[#0b5c46] hover:bg-[#094a38] text-white w-full gap-2">
                  <a href="/auth/login">
                    <LogIn className="w-4 h-4" />
                    Login
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full gap-2">
                  <a href="/auth/register">
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </a>
                </Button>
                {whatsappUrl && (
                  <Button asChild variant="outline" className="w-full gap-2 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ) : loading ? (
            /* Loading state */
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#0b5c46]" />
            </div>
          ) : (
            /* Chat state */
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-sm text-gray-400 mt-8">
                    Send a message to start the conversation
                  </div>
                )}
                {messages.map((msg) => {
                  const isOwn = msg.senderId === userId;
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
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                          isOwn
                            ? 'bg-[#0b5c46] text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                        }`}
                      >
                        {!isOwn && msg.sender && (
                          <p className="text-xs font-medium text-[#0b5c46] dark:text-[#14956e] mb-0.5">
                            {msg.sender.firstName}
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
              </div>
              {/* Input */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0b5c46]/30 border-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="w-9 h-9 rounded-full bg-[#0b5c46] text-white flex items-center justify-center hover:bg-[#094a38] disabled:opacity-40 transition-colors shrink-0"
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
          )}
        </div>
      )}

      {/* Floating Buttons */}
      <div className={`flex flex-col items-center gap-2 ${isOpen ? 'hidden md:flex' : ''}`}>
        {/* WhatsApp Button */}
        {whatsappUrl && !isOpen && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:bg-[#20bd5a] transition-all hover:scale-105"
            title="Chat on WhatsApp"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 ${
            isOpen
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-[#0b5c46] hover:bg-[#094a38] text-white'
          }`}
          title={isOpen ? 'Close support chat' : 'Chat with support'}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
