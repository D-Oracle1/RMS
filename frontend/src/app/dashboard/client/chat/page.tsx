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
import { cn, getTierBgClass } from '@/lib/utils';

const conversations = [
  { id: 1, name: 'Sarah Johnson', lastMessage: 'I have great news about the offer!', time: '5 min ago', unread: 1, online: true, role: 'Realtor', tier: 'PLATINUM' },
  { id: 2, name: 'RMS Support', lastMessage: 'Your documents have been verified', time: '2 hours ago', unread: 0, online: true, role: 'Support' },
];

const messages = [
  { id: 1, sender: 'Sarah Johnson', content: 'Hi John! I wanted to update you on the Beachfront Villa listing.', time: '10:30 AM', isMe: false },
  { id: 2, sender: 'Me', content: 'Hi Sarah! Yes, please let me know. Have there been any new offers?', time: '10:32 AM', isMe: true, read: true },
  { id: 3, sender: 'Sarah Johnson', content: 'Yes! We received two new offers this week. One is at $1.42M and another at $1.38M.', time: '10:33 AM', isMe: false },
  { id: 4, sender: 'Me', content: "That's exciting! The $1.42M offer sounds promising. What are the terms?", time: '10:35 AM', isMe: true, read: true },
  { id: 5, sender: 'Sarah Johnson', content: 'The buyer is pre-approved and ready for a quick close within 30 days. They\'re also waiving some contingencies.', time: '10:36 AM', isMe: false },
  { id: 6, sender: 'Sarah Johnson', content: 'I have great news about the offer! The buyer increased their bid to $1.45M!', time: '10:38 AM', isMe: false },
];

export default function ClientChatPage() {
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{conv.name}</p>
                          {conv.tier && (
                            <Badge className={`${getTierBgClass(conv.tier)} text-xs`}>{conv.tier}</Badge>
                          )}
                        </div>
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedConversation.name}</p>
                      {selectedConversation.tier && (
                        <Badge className={getTierBgClass(selectedConversation.tier)}>
                          {selectedConversation.tier}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.online ? 'Online' : 'Offline'} • Your {selectedConversation.role}
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
