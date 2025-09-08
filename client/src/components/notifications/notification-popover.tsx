"use client";

import { useState, useEffect, useContext } from "react";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AuthContext from "@/contexts/AuthContext";

interface Notification {
  _id: string;
  sender?: {
    username: string;
    role: string;
  };
  type: string;
  title: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
  category: string;
  status: {
    read: boolean;
    readAt?: Date;
  };
  createdAt: string;
}

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      // Set up real-time updates here if needed
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Fallback to mock data for development
      setMockNotifications();
    } finally {
      setLoading(false);
    }
  };

  const setMockNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        _id: "1",
        sender: { username: "system", role: "admin" },
        type: "message",
        title: "New message from counselor",
        message: "Dr. Smith has replied to your conversation.",
        priority: "normal",
        category: "communication",
        status: { read: false },
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        _id: "2",
        sender: { username: "system", role: "admin" },
        type: "group_invite",
        title: "Group invitation",
        message: 'You have been invited to join "Depression Support Group".',
        priority: "normal",
        category: "social",
        status: { read: false },
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        _id: "3",
        sender: { username: "system", role: "admin" },
        type: "session_scheduled",
        title: "Session reminder",
        message:
          "Your counseling session is scheduled for tomorrow at 2:00 PM.",
        priority: "high",
        category: "support",
        status: { read: true, readAt: new Date() },
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.status.read).length);
  };

  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, status: { ...n.status, read: true, readAt: new Date() } }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          status: { ...n.status, read: true, readAt: new Date() },
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "crisis_alert":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "session_scheduled":
        return <Clock className="h-4 w-4 text-green-500" />;
      case "group_invite":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium leading-none">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-6 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.status.read ? "bg-blue-50/50" : ""
                  }`}
                  onClick={() =>
                    !notification.status.read && markAsRead(notification._id)
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {notification.priority !== "normal" && (
                          <Badge
                            className={`text-xs ml-2 ${getPriorityColor(notification.priority)}`}
                            variant="outline"
                          >
                            {notification.priority}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
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
      </PopoverContent>
    </Popover>
  );
}
