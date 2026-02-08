'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Plus,
  ArrowLeft,
  Users,
  Loader2,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getImageUrl, api } from '@/lib/api';
import { getUser } from '@/lib/auth-storage';
import { useChat, ChatRoom, ChatMessage } from '@/contexts/chat-context';
import { useSocket } from '@/contexts/pusher-context';
import { useCall } from '@/contexts/call-context';

function getInitials(firstName?: string, lastName?: string) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase() || '?';
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface NewChatUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function ChatPage() {
  const currentUser = getUser();
  const { rooms, activeRoom, messages, isLoadingRooms, isLoadingMessages, typingUsers, fetchRooms, selectRoom, sendMessage, createRoom, sendTyping, setActiveRoom } = useChat();
  const { onlineUsers } = useSocket();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [newChatUsers, setNewChatUsers] = useState<NewChatUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  let callCtx: ReturnType<typeof useCall> | null = null;
  try { callCtx = useCall(); } catch { /* CallProvider may not be mounted yet */ }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const msg = newMessage;
    setNewMessage('');
    sendTyping(false);
    try {
      await sendMessage(msg);
    } catch {
      setNewMessage(msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTyping(true);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => sendTyping(false), 2000);
  };

  const handleSelectRoom = (room: ChatRoom) => {
    selectRoom(room);
    setShowMobileChat(true);
  };

  const getOtherParticipant = (room: ChatRoom) => {
    if (room.type === 'DIRECT') {
      return room.participants.find(p => p.id !== currentUser?.id) || room.participants[0];
    }
    return null;
  };

  const getRoomName = (room: ChatRoom) => {
    if (room.name) return room.name;
    if (room.type === 'DIRECT') {
      const other = getOtherParticipant(room);
      return other ? `${other.firstName} ${other.lastName}` : 'Chat';
    }
    return room.participants.map(p => p.firstName).join(', ');
  };

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'DIRECT') {
      const other = getOtherParticipant(room);
      return other;
    }
    return null;
  };

  const isOnline = (userId: string) => onlineUsers.includes(userId);

  const activeTypingUsers = typingUsers.filter(t => t.roomId === activeRoom?.id);

  // New chat - search users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) { setNewChatUsers([]); return; }
    setSearchingUsers(true);
    try {
      const res = await api.get<any>(`/admin/users?search=${encodeURIComponent(query)}&limit=20`);
      const users = res?.data || res || [];
      setNewChatUsers(Array.isArray(users) ? users.filter((u: any) => u.id !== currentUser?.id) : []);
    } catch {
      try {
        // Fallback: try staff directory
        const res = await api.get<any>(`/staff/directory?search=${encodeURIComponent(query)}`);
        const users = res?.data || res || [];
        setNewChatUsers(Array.isArray(users) ? users.filter((u: any) => u.id !== currentUser?.id) : []);
      } catch {
        setNewChatUsers([]);
      }
    } finally {
      setSearchingUsers(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(newChatSearch), 300);
    return () => clearTimeout(timer);
  }, [newChatSearch, searchUsers]);

  const startNewChat = async (user: NewChatUser) => {
    try {
      const room = await createRoom([user.id]);
      setShowNewChat(false);
      setNewChatSearch('');
      selectRoom(room);
      setShowMobileChat(true);
    } catch {
      // error
    }
  };

  const handleCall = (type: 'audio' | 'video') => {
    if (!activeRoom || !callCtx) return;
    const other = getOtherParticipant(activeRoom);
    if (other) {
      callCtx.initiateCall(other.id, type, `${other.firstName} ${other.lastName}`, other.avatar || undefined);
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true;
    const name = getRoomName(room).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-12rem)]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full">
        <Card className="h-full overflow-hidden">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={cn(
              'w-full md:w-80 border-r flex flex-col',
              showMobileChat && 'hidden md:flex'
            )}>
              <div className="p-4 border-b space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button size="icon" variant="outline" onClick={() => setShowNewChat(true)} title="New conversation">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* New chat modal */}
              <AnimatePresence>
                {showNewChat && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b overflow-hidden"
                  >
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">New Conversation</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setShowNewChat(false); setNewChatSearch(''); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Search users by name..."
                        value={newChatSearch}
                        onChange={(e) => setNewChatSearch(e.target.value)}
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {searchingUsers && (
                          <div className="flex items-center justify-center py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {newChatUsers.map(user => (
                          <button
                            key={user.id}
                            onClick={() => startNewChat(user)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                          >
                            <Avatar className="h-8 w-8">
                              {user.avatar && <AvatarImage src={getImageUrl(user.avatar)} />}
                              <AvatarFallback className="bg-primary text-white text-xs">
                                {getInitials(user.firstName, user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
                            </div>
                            {isOnline(user.id) && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                          </button>
                        ))}
                        {!searchingUsers && newChatSearch && newChatUsers.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-3">No users found</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto">
                {isLoadingRooms ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Start a new conversation using the + button</p>
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const avatarUser = getRoomAvatar(room);
                    const roomOnline = room.type === 'DIRECT' && avatarUser ? isOnline(avatarUser.id) : false;

                    return (
                      <div
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className={cn(
                          'flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                          activeRoom?.id === room.id && 'bg-primary/5'
                        )}
                      >
                        <div className="relative">
                          <Avatar>
                            {avatarUser?.avatar && <AvatarImage src={getImageUrl(avatarUser.avatar)} />}
                            <AvatarFallback className="bg-primary text-white">
                              {room.type === 'GROUP' ? (
                                <Users className="w-4 h-4" />
                              ) : (
                                getInitials(avatarUser?.firstName, avatarUser?.lastName)
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {roomOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate text-sm">{getRoomName(room)}</p>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {timeAgo(room.lastMessage?.createdAt || room.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {room.lastMessage?.content || 'No messages yet'}
                            </p>
                            {room.unreadCount > 0 && (
                              <Badge className="ml-2 bg-primary shrink-0">{room.unreadCount}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
              'flex-1 flex flex-col',
              !showMobileChat && 'hidden md:flex'
            )}>
              {activeRoom ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => { setShowMobileChat(false); setActiveRoom(null); }}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <Avatar>
                        {getRoomAvatar(activeRoom)?.avatar && (
                          <AvatarImage src={getImageUrl(getRoomAvatar(activeRoom)!.avatar!)} />
                        )}
                        <AvatarFallback className="bg-primary text-white">
                          {activeRoom.type === 'GROUP' ? (
                            <Users className="w-4 h-4" />
                          ) : (
                            getInitials(getRoomAvatar(activeRoom)?.firstName, getRoomAvatar(activeRoom)?.lastName)
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getRoomName(activeRoom)}</p>
                        <p className="text-sm text-muted-foreground">
                          {activeRoom.type === 'DIRECT' && getRoomAvatar(activeRoom)
                            ? isOnline(getRoomAvatar(activeRoom)!.id) ? 'Online' : 'Offline'
                            : `${activeRoom.participants.length} members`}
                          {activeTypingUsers.length > 0 && ' • typing...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {activeRoom.type === 'DIRECT' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleCall('audio')} title="Voice call">
                            <Phone className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleCall('video')} title="Video call">
                            <Video className="w-5 h-5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMe = message.senderId === currentUser?.id;
                        const isRead = message.readBy && message.readBy.length > 1;
                        return (
                          <div
                            key={message.id}
                            className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                          >
                            {!isMe && activeRoom.type === 'GROUP' && (
                              <Avatar className="h-8 w-8 mr-2 mt-1 shrink-0">
                                {message.sender?.avatar && <AvatarImage src={getImageUrl(message.sender.avatar)} />}
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {getInitials(message.sender?.firstName, message.sender?.lastName)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn('max-w-[70%] rounded-lg p-3', isMe ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800')}>
                              {!isMe && activeRoom.type === 'GROUP' && (
                                <p className="text-xs font-medium mb-1 opacity-70">
                                  {message.sender?.firstName} {message.sender?.lastName}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              <div className={cn('flex items-center gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
                                <span className={cn('text-xs', isMe ? 'text-white/70' : 'text-muted-foreground')}>
                                  {formatMessageTime(message.createdAt)}
                                </span>
                                {isMe && (
                                  isRead
                                    ? <CheckCheck className="w-4 h-4 text-white/70" />
                                    : <Check className="w-4 h-4 text-white/70" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Typing indicator */}
                  {activeTypingUsers.length > 0 && (
                    <div className="px-4 pb-1">
                      <p className="text-xs text-muted-foreground animate-pulse">
                        Someone is typing...
                      </p>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="flex-1"
                      />
                      <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()}>
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Select a conversation</p>
                    <p className="text-sm text-muted-foreground mt-1">Choose from your existing conversations or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
