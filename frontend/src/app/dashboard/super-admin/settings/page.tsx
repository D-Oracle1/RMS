'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getUser, updateUser } from '@/lib/auth-storage';

export default function SuperAdminSettings() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  useEffect(() => {
    const user = getUser();
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: '',
      });
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.patch<any>('/auth/profile', {
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      const updated = res.data || res;
      updateUser(updated);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your platform admin profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name</label>
              <Input
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name</label>
              <Input
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input value={profile.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
