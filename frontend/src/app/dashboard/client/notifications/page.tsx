'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  DollarSign,
  Home,
  FileText,
  MessageSquare,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

const notifications = [
  { id: 1, type: 'offer', title: 'New Offer Received!', message: 'You received a new offer of $1.45M for Beachfront Villa', time: '2024-01-20T10:30:00', read: false },
  { id: 2, type: 'message', title: 'New Message', message: 'Sarah Johnson sent you a message about the property offer', time: '2024-01-20T10:38:00', read: false },
  { id: 3, type: 'property', title: 'Property Value Update', message: 'Your Modern Downtown Condo has increased in value by 5%', time: '2024-01-19T15:45:00', read: false },
  { id: 4, type: 'document', title: 'Document Verified', message: 'Your Property Deed for Beachfront Villa has been verified', time: '2024-01-18T09:20:00', read: true },
  { id: 5, type: 'offer', title: 'Offer Update', message: 'The buyer for Beachfront Villa has increased their offer', time: '2024-01-17T14:30:00', read: true },
  { id: 6, type: 'property', title: 'Listing Active', message: 'Your Beachfront Villa is now listed for sale', time: '2024-01-15T10:00:00', read: true },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'offer': return <DollarSign className="w-5 h-5 text-green-600" />;
    case 'message': return <MessageSquare className="w-5 h-5 text-blue-600" />;
    case 'property': return <Home className="w-5 h-5 text-purple-600" />;
    case 'document': return <FileText className="w-5 h-5 text-orange-600" />;
    case 'value': return <TrendingUp className="w-5 h-5 text-primary" />;
    default: return <Bell className="w-5 h-5" />;
  }
};

const getBgColor = (type: string) => {
  switch (type) {
    case 'offer': return 'bg-green-100';
    case 'message': return 'bg-blue-100';
    case 'property': return 'bg-purple-100';
    case 'document': return 'bg-orange-100';
    case 'value': return 'bg-primary/10';
    default: return 'bg-gray-100';
  }
};

export default function ClientNotificationsPage() {
  const [notificationList, setNotificationList] = useState(notifications);
  const unreadCount = notificationList.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotificationList(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotificationList(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotificationList(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Bell className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Notifications</h2>
                  <p className="text-muted-foreground">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notificationList.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg transition-colors',
                    notification.read
                      ? 'bg-gray-50 dark:bg-gray-800/30'
                      : 'bg-primary/5 border-l-4 border-primary'
                  )}
                >
                  <div className={cn('p-2 rounded-lg', getBgColor(notification.type))}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDate(notification.time)}</p>
                      </div>
                      {!notification.read && (
                        <Badge className="bg-primary shrink-0">New</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
