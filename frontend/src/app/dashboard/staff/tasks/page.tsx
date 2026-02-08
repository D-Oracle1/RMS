'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Clock,
  MessageSquare,
  MoreVertical,
  Calendar,
  Loader2,
  RefreshCw,
  Play,
  CheckCircle2,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { api, getImageUrl } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  completedAt: string | null;
  creator?: {
    user: { firstName: string; lastName: string };
  };
  _count?: { comments: number };
}

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  completed: number;
  blocked: number;
  overdue: number;
}

const columns = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-purple-500' },
  { id: 'COMPLETED', title: 'Completed', color: 'bg-green-500' },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-500';
    case 'HIGH':
      return 'bg-orange-500';
    case 'MEDIUM':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-400';
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Urgent</Badge>;
    case 'HIGH':
      return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">High</Badge>;
    case 'MEDIUM':
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">Medium</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">Low</Badge>;
  }
};

const isOverdue = (dueDate: string | null, status: string) => {
  if (!dueDate || status === 'COMPLETED') return false;
  return new Date(dueDate) < new Date();
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes] = await Promise.allSettled([
        api.get<any>('/tasks/my'),
        api.get<any>('/tasks/stats'),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const data = tasksRes.value?.data || tasksRes.value;
        setTasks(Array.isArray(data) ? data : []);
      }

      if (statsRes.status === 'fulfilled') {
        const data = statsRes.value?.data || statsRes.value;
        setStats(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
      toast.error(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setActionLoading(taskId);
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success(`Task moved to ${newStatus.replace('_', ' ').toLowerCase()}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task status');
    } finally {
      setActionLoading(null);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const getColumnCount = (columnId: string) => {
    if (!stats) return getTasksByStatus(columnId).length;
    switch (columnId) {
      case 'TODO':
        return stats.todo;
      case 'IN_PROGRESS':
        return stats.inProgress;
      case 'IN_REVIEW':
        return stats.inReview;
      case 'COMPLETED':
        return stats.completed;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">Manage and track your assigned tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {columns.map((column, index) => {
          const count = getColumnCount(column.id);
          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <span className="font-medium">{column.title}</span>
                    <Badge variant="secondary" className="ml-auto">{count}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Overdue Warning */}
      {stats && stats.overdue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800 dark:text-orange-200">
                You have <strong>{stats.overdue}</strong> overdue task{stats.overdue > 1 ? 's' : ''}
              </span>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Kanban Board */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No tasks assigned</p>
            <p className="text-sm">Tasks assigned to you will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {columns.map((column, columnIndex) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + columnIndex * 0.1 }}
            >
              <Card className="bg-gray-50 dark:bg-gray-900/50 min-h-[400px]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    {column.title}
                    <Badge variant="outline" className="ml-auto">
                      {getTasksByStatus(column.id).length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getTasksByStatus(column.id).map((task, taskIndex) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    const creatorName = task.creator?.user
                      ? `${task.creator.user.firstName} ${task.creator.user.lastName}`
                      : 'Unknown';
                    const creatorInitials = task.creator?.user
                      ? `${task.creator.user.firstName[0]}${task.creator.user.lastName[0]}`
                      : '??';

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + taskIndex * 0.05 }}
                        className={`p-3 rounded-lg bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-shadow ${
                          overdue ? 'border-orange-300 dark:border-orange-700' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className={`w-1 h-full min-h-[20px] rounded-full ${getPriorityColor(task.priority)}`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-2">{task.title}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={actionLoading === task.id}
                              >
                                {actionLoading === task.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2">
                                <Eye className="w-4 h-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {task.status === 'TODO' && (
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                                >
                                  <Play className="w-4 h-4" />
                                  Start Task
                                </DropdownMenuItem>
                              )}
                              {task.status === 'IN_PROGRESS' && (
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => handleStatusChange(task.id, 'IN_REVIEW')}
                                >
                                  <Eye className="w-4 h-4" />
                                  Submit for Review
                                </DropdownMenuItem>
                              )}
                              {task.status === 'IN_REVIEW' && (
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                                >
                                  <Play className="w-4 h-4" />
                                  Back to Progress
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1 mb-2">
                          {getPriorityBadge(task.priority)}
                          {task.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{task.tags.length - 2}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className={`flex items-center gap-1 ${overdue ? 'text-orange-600 font-medium' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.dueDate)}
                            {overdue && ' (Overdue)'}
                          </div>
                          <div className="flex items-center gap-2">
                            {task._count && task._count.comments > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {task._count.comments}
                              </span>
                            )}
                            <Avatar className="w-5 h-5" title={`Assigned by: ${creatorName}`}>
                              <AvatarFallback className="text-[10px] bg-primary text-white">
                                {creatorInitials}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {getTasksByStatus(column.id).length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No tasks
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
