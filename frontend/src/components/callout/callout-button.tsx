'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BellRing, Search, X, Loader2, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api, getImageUrl } from '@/lib/api';
import { useSocket } from '@/contexts/pusher-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: string;
  staffProfile?: {
    title?: string;
    department?: { name: string };
  };
}

export function CalloutButton() {
  const { onlineUsers } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/notifications/callout/staff');
      const users = Array.isArray(res) ? res : (res?.data || []);
      setStaff(Array.isArray(users) ? users : []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && staff.length === 0) {
      fetchStaff();
    }
  }, [isOpen, staff.length, fetchStaff]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedStaff(null);
        setMessage('');
        setSent(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStaff = staff.filter(s => {
    if (!search) return true;
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    const email = s.email?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const handleSendCallout = async () => {
    if (!selectedStaff) return;
    setSending(true);
    try {
      await api.post('/notifications/callout', {
        targetUserId: selectedStaff.id,
        message: message || undefined,
      });
      setSent(true);
      toast.success(`Callout sent to ${selectedStaff.firstName} ${selectedStaff.lastName}`);
      setTimeout(() => {
        setSelectedStaff(null);
        setMessage('');
        setSent(false);
      }, 2000);
    } catch {
      toast.error('Failed to send callout');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        title="Call out staff"
        className="relative"
      >
        <BellRing className="w-5 h-5" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-lg shadow-lg border z-50 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-sm mb-2">Call Out Staff</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {selectedStaff ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {selectedStaff.avatar && <AvatarImage src={getImageUrl(selectedStaff.avatar)} />}
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {selectedStaff.firstName[0]}{selectedStaff.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedStaff.firstName} {selectedStaff.lastName}</p>
                    <p className="text-xs text-muted-foreground">{selectedStaff.staffProfile?.title || selectedStaff.role}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSelectedStaff(null); setSent(false); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {sent ? (
                <div className="flex items-center gap-2 text-green-600 py-2">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Callout sent!</span>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Optional message (e.g., 'Please come to my office')"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendCallout(); }}
                  />
                  <Button
                    className="w-full"
                    onClick={handleSendCallout}
                    disabled={sending}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Callout
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No staff found</p>
              ) : (
                filteredStaff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStaff(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left border-b last:border-b-0"
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        {s.avatar && <AvatarImage src={getImageUrl(s.avatar)} />}
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {s.firstName[0]}{s.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {onlineUsers.includes(s.id) && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.staffProfile?.title || s.role}
                        {s.staffProfile?.department?.name && ` • ${s.staffProfile.department.name}`}
                      </p>
                    </div>
                    <span className={cn(
                      'text-xs shrink-0',
                      onlineUsers.includes(s.id) ? 'text-green-600' : 'text-muted-foreground'
                    )}>
                      {onlineUsers.includes(s.id) ? 'Online' : 'Offline'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
