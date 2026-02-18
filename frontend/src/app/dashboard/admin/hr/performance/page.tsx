'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Search,
  Plus,
  Download,
  Clock,
  CheckCircle2,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api, getImageUrl } from '@/lib/api';

interface PerformanceReview {
  id: string;
  cycle: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  overallRating: number | null;
  createdAt: string;
  reviewee: {
    id: string;
    user: { firstName: string; lastName: string; avatar: string | null };
    department: { name: string } | null;
  };
  reviewer: {
    user: { firstName: string; lastName: string };
  };
}

interface StaffMember {
  id: string;
  user: { firstName: string; lastName: string };
}

const formatPeriod = (start: string, end: string, cycle: string) => {
  const endDate = new Date(end);
  if (cycle === 'ANNUAL') {
    return `Annual ${endDate.getFullYear()}`;
  }
  const quarter = Math.ceil((endDate.getMonth() + 1) / 3);
  return `Q${quarter} ${endDate.getFullYear()}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="secondary">Draft</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-yellow-100 text-yellow-700">Pending Ack.</Badge>;
    case 'ACKNOWLEDGED':
      return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getRatingColor = (rating: number | null) => {
  if (!rating) return 'text-muted-foreground';
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-blue-600';
  if (rating >= 2.5) return 'text-yellow-600';
  return 'text-red-600';
};

export default function AdminPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newRevieweeId, setNewRevieweeId] = useState('');
  const [newCycle, setNewCycle] = useState('QUARTERLY');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (cycleFilter !== 'all') params.append('cycle', cycleFilter);

      const [reviewsRes, staffRes] = await Promise.allSettled([
        api.get<any>(`/hr/reviews?${params.toString()}`),
        api.get<any>('/staff?limit=100'),
      ]);

      if (reviewsRes.status === 'fulfilled') {
        const data = reviewsRes.value?.data?.data || reviewsRes.value?.data || [];
        setReviews(Array.isArray(data) ? data : []);
      }

      if (staffRes.status === 'fulfilled') {
        const data = staffRes.value?.data?.data || staffRes.value?.data || [];
        setStaff(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      toast.error(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cycleFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateReview = async () => {
    if (!newRevieweeId) {
      toast.error('Please select a staff member');
      return;
    }

    setCreateLoading(true);
    try {
      const now = new Date();
      let periodStart: Date, periodEnd: Date;

      if (newCycle === 'QUARTERLY') {
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      } else {
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
      }

      await api.post('/hr/reviews', {
        revieweeId: newRevieweeId,
        cycle: newCycle,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
      });

      toast.success('Performance review created');
      setCreateDialogOpen(false);
      setNewRevieweeId('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create review');
    } finally {
      setCreateLoading(false);
    }
  };

  // Calculate stats
  const activeCount = reviews.filter((r) => r.status === 'DRAFT' || r.status === 'IN_PROGRESS').length;
  const completedCount = reviews.filter((r) => r.status === 'COMPLETED' || r.status === 'ACKNOWLEDGED').length;
  const avgRating = reviews
    .filter((r) => r.overallRating)
    .reduce((sum, r, _, arr) => sum + (r.overallRating || 0) / arr.length, 0);

  const reviewCycleStats = [
    { label: 'Active Reviews', value: activeCount, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Avg. Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '-', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Total Reviews', value: reviews.length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  // Filter by search
  const filteredReviews = reviews.filter((review) => {
    if (!searchQuery) return true;
    const name = `${review.reviewee?.user?.firstName || ''} ${review.reviewee?.user?.lastName || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Top performers (completed reviews with highest ratings)
  const topPerformers = [...reviews]
    .filter((r) => r.overallRating && (r.status === 'COMPLETED' || r.status === 'ACKNOWLEDGED'))
    .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
    .slice(0, 5);

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance Reviews</h1>
          <p className="text-muted-foreground">Manage performance review cycles and evaluations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Review
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {reviewCycleStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={cycleFilter} onValueChange={setCycleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Cycle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cycles</SelectItem>
            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
            <SelectItem value="ANNUAL">Annual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Pending Ack.</SelectItem>
            <SelectItem value="ACKNOWLEDGED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reviews Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Performance Reviews
                <Badge variant="secondary">{filteredReviews.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reviews found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              {review.reviewee?.user?.avatar && (
                                <AvatarImage src={getImageUrl(review.reviewee.user.avatar)} />
                              )}
                              <AvatarFallback className="bg-primary text-white text-xs">
                                {review.reviewee?.user?.firstName?.[0] || ''}
                                {review.reviewee?.user?.lastName?.[0] || ''}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {review.reviewee?.user?.firstName} {review.reviewee?.user?.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {review.reviewee?.department?.name || 'No Dept'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatPeriod(review.periodStart, review.periodEnd, review.cycle)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getRatingColor(review.overallRating)}`}>
                            {review.overallRating ? review.overallRating.toFixed(1) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No completed reviews yet</p>
              ) : (
                topPerformers.map((review, index) => (
                  <div key={review.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <Avatar className="w-8 h-8">
                      {review.reviewee?.user?.avatar && (
                        <AvatarImage src={getImageUrl(review.reviewee.user.avatar)} />
                      )}
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {review.reviewee?.user?.firstName?.[0] || ''}
                        {review.reviewee?.user?.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {review.reviewee?.user?.firstName} {review.reviewee?.user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {review.reviewee?.department?.name || 'No Dept'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-sm">{review.overallRating?.toFixed(1)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Review Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Performance Review</DialogTitle>
            <DialogDescription>
              Start a new performance review for a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Staff Member *</Label>
              <Select value={newRevieweeId} onValueChange={setNewRevieweeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user.firstName} {s.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Review Cycle *</Label>
              <Select value={newCycle} onValueChange={setNewCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReview} disabled={createLoading}>
              {createLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
