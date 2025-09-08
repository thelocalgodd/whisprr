const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Data types
export interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: 'user' | 'counselor' | 'admin' | 'moderator';
  isActive: boolean;
  isVerified: boolean;
  bio?: string;
  status?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  content: string;
  sender: User;
  conversation: string;
  messageType: 'text' | 'image' | 'file';
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  reactions?: { emoji: string; users: string[] }[];
}

export interface Conversation {
  _id: string;
  name?: string;
  participants: User[];
  lastMessage?: Message;
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  members: number;
  avatar?: string;
  isPublic: boolean;
  createdBy: User;
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  description: string;
  type: 'message' | 'friend_request' | 'group_invite' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface Resource {
  _id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'audio' | 'pdf' | 'link' | 'tool';
  url: string;
  category: 'anxiety' | 'depression' | 'stress' | 'relationships' | 'self-care' | 'therapy' | 'meditation' | 'crisis' | 'general';
  tags: string[];
  views: number;
  likesCount: number;
  dislikesCount: number;
  rating: {
    total: number;
    count: number;
    average: number;
  };
  createdBy: User;
  createdAt: string;
}

// Generic API client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      };

      // Get token from localStorage if available
      const token = localStorage.getItem('token');
      if (token) {
        defaultOptions.headers = {
          ...defaultOptions.headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  register: (userData: { 
    username: string; 
    email: string; 
    password: string; 
    fullName: string;
  }) => apiClient.post('/auth/register', userData),
  
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  
  logout: () => apiClient.post('/auth/logout'),
  
  getProfile: () => apiClient.get<User>('/auth/profile'),
  
  updateProfile: (data: Partial<User>) => 
    apiClient.put('/auth/profile', data),
};

// User API
export const userApi = {
  searchUsers: (query: string) => 
    apiClient.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`),
  
  getUserProfile: (userId: string) => 
    apiClient.get<User>(`/users/profile/${userId}`),
  
  updateProfile: (data: Partial<User>) => 
    apiClient.put('/users/profile', data),
  
  getContacts: () => 
    apiClient.get<User[]>('/users/contacts'),
  
  addContact: (userId: string) => 
    apiClient.post('/users/contacts', { userId }),
  
  removeContact: (contactId: string) => 
    apiClient.delete(`/users/contacts/${contactId}`),
  
  blockUser: (userId: string) => 
    apiClient.post('/users/block', { userId }),
  
  unblockUser: (userId: string) => 
    apiClient.delete(`/users/block/${userId}`),
  
  getBlockedUsers: () => 
    apiClient.get<User[]>('/users/blocked'),
};

// Conversations API
export const conversationApi = {
  getConversations: () => 
    apiClient.get<Conversation[]>('/conversations'),
  
  getConversation: (conversationId: string) => 
    apiClient.get<Conversation>(`/conversations/${conversationId}`),
  
  createConversation: (participantIds: string[]) => 
    apiClient.post('/conversations/create', { participantIds }),
  
  deleteConversation: (conversationId: string) => 
    apiClient.delete(`/conversations/${conversationId}`),
  
  leaveConversation: (conversationId: string) => 
    apiClient.post(`/conversations/${conversationId}/leave`),
  
  archiveConversation: (conversationId: string) => 
    apiClient.post(`/conversations/${conversationId}/archive`),
};

// Messages API
export const messageApi = {
  getMessages: (conversationId: string, page = 1, limit = 50) => 
    apiClient.get<Message[]>(`/messages/conversation/${conversationId}?page=${page}&limit=${limit}`),
  
  sendMessage: (data: { 
    conversationId: string; 
    content: string; 
    messageType?: 'text' | 'image' | 'file';
  }) => apiClient.post('/messages/send', data),
  
  editMessage: (messageId: string, content: string) => 
    apiClient.put(`/messages/${messageId}`, { content }),
  
  deleteMessage: (messageId: string) => 
    apiClient.delete(`/messages/${messageId}`),
  
  markAsRead: (messageId: string) => 
    apiClient.put(`/messages/${messageId}/read`),
  
  getUnreadCount: () => 
    apiClient.get<{ count: number }>('/messages/unread/count'),
  
  reactToMessage: (messageId: string, emoji: string) => 
    apiClient.post(`/messages/${messageId}/react`, { emoji }),
};

// Groups API
export const groupApi = {
  getGroups: () => 
    apiClient.get<Group[]>('/groups'),
  
  createGroup: (data: { 
    name: string; 
    description: string; 
    isPublic?: boolean;
  }) => apiClient.post('/groups/create', data),
  
  joinGroup: (groupId: string) => 
    apiClient.post(`/groups/${groupId}/join`),
  
  getGroupMessages: (groupId: string, page = 1, limit = 50) => 
    apiClient.get<Message[]>(`/groups/${groupId}/messages?page=${page}&limit=${limit}`),
  
  sendGroupMessage: (groupId: string, content: string) => 
    apiClient.post(`/groups/${groupId}/message`, { content }),
};

// Notifications API
export const notificationApi = {
  getNotifications: () => 
    apiClient.get<Notification[]>('/notifications'),
  
  markAsRead: (notificationId: string) => 
    apiClient.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => 
    apiClient.put('/notifications/read-all'),
  
  deleteNotification: (notificationId: string) => 
    apiClient.delete(`/notifications/${notificationId}`),
};

// Search API
export const searchApi = {
  searchAll: (query: string) => 
    apiClient.get(`/search?q=${encodeURIComponent(query)}`),
  
  searchUsers: (query: string) => 
    apiClient.get(`/search/users?q=${encodeURIComponent(query)}`),
  
  searchMessages: (query: string) => 
    apiClient.get(`/search/messages?q=${encodeURIComponent(query)}`),
};

// Resources API
export const resourceApi = {
  getResources: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const queryString = searchParams.toString();
    return apiClient.get<{
      resources: Resource[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalResources: number;
        hasMore: boolean;
      };
    }>(`/resources${queryString ? `?${queryString}` : ''}`);
  },
  
  getResourceById: (resourceId: string) => 
    apiClient.get<Resource>(`/resources/${resourceId}`),
  
  createResource: (data: {
    title: string;
    description: string;
    type: string;
    url: string;
    category?: string;
    tags?: string[];
  }) => apiClient.post<Resource>('/resources/create', data),
  
  updateResource: (resourceId: string, data: Partial<Resource>) => 
    apiClient.put<Resource>(`/resources/${resourceId}`, data),
  
  deleteResource: (resourceId: string) => 
    apiClient.delete(`/resources/${resourceId}`),
  
  likeResource: (resourceId: string) => 
    apiClient.post(`/resources/${resourceId}/like`),
  
  dislikeResource: (resourceId: string) => 
    apiClient.post(`/resources/${resourceId}/dislike`),
};

export default apiClient;