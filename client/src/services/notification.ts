import { 
  notificationApi, 
  searchApi,
  type Notification, 
  type User,
  type Group,
  type Resource,
  type Message,
  type ApiResponse 
} from '@/lib/api';

// Notification management functions
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await notificationApi.getNotifications();
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const response = await notificationApi.markAsRead(notificationId);
    return response.success;
  } catch (error) {
    console.error(`Failed to mark notification ${notificationId} as read:`, error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const response = await notificationApi.markAllAsRead();
    return response.success;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const response = await notificationApi.deleteNotification(notificationId);
    return response.success;
  } catch (error) {
    console.error(`Failed to delete notification ${notificationId}:`, error);
    throw error;
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await notificationApi.getUnreadCount();
    
    if (response.success && response.data) {
      return response.data.count;
    }
    
    return 0;
  } catch (error) {
    console.error('Failed to fetch unread notification count:', error);
    throw error;
  }
};

// Search functions
export const searchAll = async (query: string): Promise<{
  users: User[];
  groups: Group[];
  resources: Resource[];
  messages: Message[];
}> => {
  try {
    const response = await searchApi.searchAll(query);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return { users: [], groups: [], resources: [], messages: [] };
  } catch (error) {
    console.error('Failed to perform global search:', error);
    throw error;
  }
};

export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const response = await searchApi.searchUsers(query);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to search users:', error);
    throw error;
  }
};

export const searchGroups = async (query: string): Promise<Group[]> => {
  try {
    const response = await searchApi.searchGroups(query);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to search groups:', error);
    throw error;
  }
};

export const searchResources = async (query: string): Promise<Resource[]> => {
  try {
    const response = await searchApi.searchResources(query);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to search resources:', error);
    throw error;
  }
};

export const searchMessages = async (query: string, conversationId?: string): Promise<Message[]> => {
  try {
    const response = await searchApi.searchMessages(query, conversationId);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to search messages:', error);
    throw error;
  }
};

// Notification utility functions
export const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'message':
      return '💬';
    case 'friend_request':
      return '👥';
    case 'group_invite':
      return '🏷️';
    case 'system':
      return '⚙️';
    case 'crisis_alert':
      return '🚨';
    default:
      return '🔔';
  }
};

export const getNotificationColor = (type: string): string => {
  switch (type) {
    case 'message':
      return 'text-blue-600';
    case 'friend_request':
      return 'text-green-600';
    case 'group_invite':
      return 'text-purple-600';
    case 'system':
      return 'text-gray-600';
    case 'crisis_alert':
      return 'text-red-600';
    default:
      return 'text-blue-600';
  }
};

export const formatNotificationTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
  
  // More than a week, show date
  return date.toLocaleDateString();
};

export const sortNotificationsByDate = (notifications: Notification[]): Notification[] => {
  return [...notifications].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const filterUnreadNotifications = (notifications: Notification[]): Notification[] => {
  return notifications.filter(notification => !notification.isRead);
};

export const filterNotificationsByType = (notifications: Notification[], type: string): Notification[] => {
  return notifications.filter(notification => notification.type === type);
};

export const groupNotificationsByDate = (notifications: Notification[]): { [key: string]: Notification[] } => {
  const grouped: { [key: string]: Notification[] } = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
      key = 'This Week';
    } else {
      key = 'Earlier';
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    
    grouped[key].push(notification);
  });
  
  return grouped;
};

// Search utility functions
export const highlightSearchTerm = (text: string, query: string): string => {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const getSearchResultType = (result: any): string => {
  if (result.username || result.email) return 'user';
  if (result.name && result.members !== undefined) return 'group';
  if (result.title && result.category) return 'resource';
  if (result.content && result.sender) return 'message';
  return 'unknown';
};

export const formatSearchResults = (results: {
  users: User[];
  groups: Group[];
  resources: Resource[];
  messages: Message[];
}): Array<{ type: string; item: any }> => {
  const formatted: Array<{ type: string; item: any }> = [];
  
  results.users.forEach(user => formatted.push({ type: 'user', item: user }));
  results.groups.forEach(group => formatted.push({ type: 'group', item: group }));
  results.resources.forEach(resource => formatted.push({ type: 'resource', item: resource }));
  results.messages.forEach(message => formatted.push({ type: 'message', item: message }));
  
  return formatted;
};

export const getSearchResultIcon = (type: string): string => {
  switch (type) {
    case 'user':
      return '👤';
    case 'group':
      return '👥';
    case 'resource':
      return '📚';
    case 'message':
      return '💬';
    default:
      return '🔍';
  }
};

export const getSearchResultColor = (type: string): string => {
  switch (type) {
    case 'user':
      return 'text-blue-600';
    case 'group':
      return 'text-green-600';
    case 'resource':
      return 'text-purple-600';
    case 'message':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
};

// Export types for backward compatibility
export type { Notification, User, Group, Resource, Message };