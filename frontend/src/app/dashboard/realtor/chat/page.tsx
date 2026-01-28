'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const conversations = [
  { id: 1, name: 'John Doe', lastMessage: 'When can we schedule the viewing?', time: '2 min ago', unread: 2, online: true, role: 'Client' },
  { id: 2, name: 'Jane Smith', lastMessage: "I'm interested in the Beverly Hills property", time: '15 min ago', unread: 0, online: false, role: 'Client' },
  { id: 3, name: 'Admin Support', lastMessage: 'Your commission has been processed', time: '1 hour ago', unread: 1, online: true, role: 'Admin' },
  { id: 4, name: 'Robert Johnson', lastMessage: 'Thanks for the update on the offer', time: '3 hours ago', unread: 0, online: false, role: 'Client' },
  { id: 5, name: 'Emily White', lastMessage: 'Can you send me the documents?', time: '1 day ago', unread: 0, online: false, role: 'Client' },
];

const messages = [
  { id: 1, sender: 'John Doe', content: 'Hi! I saw the Modern Villa listing and I\'m very interested.', time: '10:30 AM', isMe: false },
  { id: 2, sender: 'Me', content: 'Hello John! Great to hear from you. The villa is a stunning property with 5 bedrooms and amazing views.', time: '10:32 AM', isMe: true, read: true },
  { id: 3, sender: 'John Doe', content: 'It looks perfect for my family. What\'s the asking price?', time: '10:33 AM', isMe: false },
  { id: 4, sender: 'Me', content: 'The property is listed at $2.85M. It includes a pool, home theater, and a wine cellar.', time: '10:35 AM', isMe: true, read: true },
  { id: 5, sender: 'John Doe', content: 'That\'s within our budget. When can we schedule a viewing?', time: '10:36 AM', isMe: false },
];

export default function RealtorChatPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState('');

  return (
    <div className="h-[calc(100vh-12rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search conversations..." className="pl-9" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      'flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                      selectedConversation.id === conv.id && 'bg-primary/5'
                    )}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-white">
                          {conv.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conv.name}</p>
                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <Badge className="ml-2 bg-primary">{conv.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-white">
                      {selectedConversation.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConversation.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.online ? 'Online' : 'Offline'} • {selectedConversation.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.isMe ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-lg p-3',
                        message.isMe
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-800'
                      )}
                    >
                      <p>{message.content}</p>
                      <div className={cn(
                        'flex items-center gap-1 mt-1',
                        message.isMe ? 'justify-end' : 'justify-start'
                      )}>
                        <span className={cn(
                          'text-xs',
                          message.isMe ? 'text-white/70' : 'text-muted-foreground'
                        )}>
                          {message.time}
                        </span>
                        {message.isMe && (
                          message.read
                            ? <CheckCheck className="w-4 h-4 text-white/70" />
                            : <Check className="w-4 h-4 text-white/70" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button size="icon">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
