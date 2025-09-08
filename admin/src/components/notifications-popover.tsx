"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, Clock, AlertCircle, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Notification {
  _id: string;
  sender?: {
    username: string;
    role: string;
  };
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  status: {
    read: boolean;
    readAt?: Date;
  };
  createdAt: string;
}

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up real-time updates here if needed
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // This would be the actual API call
      // const response = await fetch('/api/notifications?limit=10', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setNotifications(data.data.notifications);
      // setUnreadCount(data.data.unreadCount);

      // Mock data for demo
      const mockNotifications: Notification[] = [
        {
          _id: '1',
          sender: { username: 'system', role: 'admin' },
          type: 'crisis_alert',
          title: 'Crisis Alert: Urgent Review Required',
          message: 'A user has triggered crisis keywords. Immediate attention needed.',
          priority: 'urgent',
          category: 'security',
          status: { read: false },
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          _id: '2',
          sender: { username: 'system', role: 'admin' },
          type: 'counselor_request',
          title: 'New Counselor Application',
          message: 'Dr. Sarah Johnson has submitted a counselor application for review.',
          priority: 'high',
          category: 'support',
          status: { read: false },
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          _id: '3',
          sender: { username: 'system', role: 'admin' },
          type: 'report_update',
          title: 'Content Report Resolved',
          message: 'The inappropriate content report #1234 has been resolved.',
          priority: 'normal',
          category: 'system',
          status: { read: true, readAt: new Date() },
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.status.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // await fetch(`/api/notifications/${notificationId}/read`, {
      //   method: 'PATCH',
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, status: { ...n.status, read: true, readAt: new Date() } }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // await fetch('/api/notifications/read-all', {
      //   method: 'PATCH',
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: { ...n.status, read: true, readAt: new Date() } }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crisis_alert': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'counselor_request': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'report_update': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Notifications</DialogTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !notification.status.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.status.read && markAsRead(notification._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <Badge 
                          className={`text-xs ${getPriorityColor(notification.priority)}`}
                          variant="outline"
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                        
                        {!notification.status.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Navigate to full notifications management page if needed
                console.log('View all notifications');
              }}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}