'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Hash,
  Plus,
  Search,
  Send,
  Paperclip,
  Smile,
  AtSign,
  Users,
  Bell,
  MoreVertical,
  Pin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data
const channels = [
  { id: '1', name: 'general', type: 'GENERAL', unread: 3, members: 48, description: 'General company discussions' },
  { id: '2', name: 'sales-team', type: 'DEPARTMENT', unread: 12, members: 15, description: 'Sales department channel' },
  { id: '3', name: 'announcements', type: 'ANNOUNCEMENT', unread: 1, members: 48, description: 'Company announcements' },
  { id: '4', name: 'marketing', type: 'DEPARTMENT', unread: 0, members: 8, description: 'Marketing team discussions' },
  { id: '5', name: 'lekki-project', type: 'PROJECT', unread: 5, members: 6, description: 'Lekki Phase 1 project team' },
  { id: '6', name: 'random', type: 'GENERAL', unread: 0, members: 48, description: 'Non-work banter' },
];

const messages = [
  {
    id: 1,
    author: { name: 'Sarah Johnson', initials: 'SJ' },
    content: 'Good morning team! Just a reminder that the Q1 targets meeting is at 2 PM today. Please come prepared with your pipeline updates.',
    time: '9:30 AM',
    reactions: [{ emoji: '👍', count: 5 }, { emoji: '✅', count: 3 }],
    pinned: true,
  },
  {
    id: 2,
    author: { name: 'Michael Chen', initials: 'MC' },
    content: 'I just closed the deal on the Victoria Island property! 🎉 Client signed this morning.',
    time: '10:15 AM',
    reactions: [{ emoji: '🎉', count: 8 }, { emoji: '🔥', count: 4 }],
    pinned: false,
  },
  {
    id: 3,
    author: { name: 'Emily Davis', initials: 'ED' },
    content: '@Michael Chen Congrats! That\'s a huge win. What was the final price?',
    time: '10:20 AM',
    reactions: [],
    pinned: false,
  },
  {
    id: 4,
    author: { name: 'Michael Chen', initials: 'MC' },
    content: '₦420M. The client was very pleased with the negotiation.',
    time: '10:22 AM',
    reactions: [{ emoji: '💰', count: 3 }],
    pinned: false,
  },
  {
    id: 5,
    author: { name: 'James Wilson', initials: 'JW' },
    content: 'Has anyone seen the updated commission structure for Q1? I couldn\'t find it on the shared drive.',
    time: '11:00 AM',
    reactions: [],
    pinned: false,
  },
  {
    id: 6,
    author: { name: 'Sarah Johnson', initials: 'SJ' },
    content: '@James Wilson I\'ll share the updated document in the #announcements channel after the meeting.',
    time: '11:05 AM',
    reactions: [{ emoji: '👍', count: 2 }],
    pinned: false,
  },
];

const getChannelIcon = (type: string) => {
  switch (type) {
    case 'ANNOUNCEMENT':
      return <Bell className="w-4 h-4" />;
    case 'PROJECT':
      return <Hash className="w-4 h-4 text-blue-500" />;
    default:
      return <Hash className="w-4 h-4" />;
  }
};

export default function ChannelsPage() {
  const [activeChannel, setActiveChannel] = useState(channels[1]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Channels</h1>
          <p className="text-muted-foreground">Collaborate with your team in real-time</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Channel
        </Button>
      </div>

      {/* Channel Layout */}
      <div className="grid gap-4 lg:grid-cols-4" style={{ height: 'calc(100vh - 250px)' }}>
        {/* Channel List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search channels..." className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[500px]">
                <div className="space-y-1">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setActiveChannel(channel)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        activeChannel.id === channel.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {getChannelIcon(channel.type)}
                      <span className="flex-1 text-left font-medium">{channel.name}</span>
                      {channel.unread > 0 && (
                        <Badge
                          variant={activeChannel.id === channel.id ? 'secondary' : 'default'}
                          className="h-5 min-w-[20px] justify-center text-xs"
                        >
                          {channel.unread}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Message Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3"
        >
          <Card className="h-full flex flex-col">
            {/* Channel Header */}
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Hash className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{activeChannel.name}</h3>
                    <p className="text-xs text-muted-foreground">{activeChannel.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Pin className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Users className="w-4 h-4" />
                    {activeChannel.members}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.pinned ? 'bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border-l-2 border-yellow-500' : ''}`}>
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {message.author.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{message.author.name}</span>
                        <span className="text-xs text-muted-foreground">{message.time}</span>
                        {message.pinned && <Pin className="w-3 h-3 text-yellow-600" />}
                      </div>
                      <p className="text-sm mt-1">{message.content}</p>
                      {message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {message.reactions.map((reaction, i) => (
                            <button
                              key={i}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs hover:bg-gray-200 transition-colors"
                            >
                              {reaction.emoji} {reaction.count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder={`Message #${activeChannel.name}`}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <AtSign className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
