import api from '@/utils/axios';

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
  profile?: {
    displayName: string;
    bio: string;
    avatar?: string;
    pronouns?: string;
    timezone?: string;
    languages?: string[];
  };
  counselorInfo?: {
    isVerified: boolean;
    verificationStatus: 'pending' | 'approved' | 'rejected';
    verificationDocuments: string[];
    specializations: string[];
    certifications: string[];
    availabilityStatus: boolean;
    rating: number;
    totalSessions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  content: {
    text: string;
    type?: string;
  };
  sender: User;
  group?: {
    _id: string;
    name: string;
    type: string;
  };
  conversationId?: string;
  messageType: 'text' | 'image' | 'file' | 'voice' | 'system';
  status: {
    sentAt: string;
    editedAt?: string;
    deletedAt?: string;
  };
  moderation?: {
    flagged: boolean;
    action: string;
  };
  crisis?: {
    detected: boolean;
    keywords: string[];
    severity: string;
  };
  isRead: boolean;
  reactions?: { emoji: string; users: string[] }[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  name?: string;
  participants: User[];
  lastMessage?: Message;
  isGroup: boolean;
  type: 'private' | 'group';
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  type: 'support' | 'therapy' | 'general';
  isPublic: boolean;
  settings: {
    maxMembers: number;
    allowInvites: boolean;
    moderationLevel: string;
  };
  statistics: {
    totalMembers: number;
    activeMembers: number;
    totalMessages: number;
  };
  createdBy: User;
  moderators: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'message' | 'friend_request' | 'group_invite' | 'system' | 'crisis_alert';
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export interface Resource {
  _id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'audio' | 'pdf' | 'link' | 'tool' | 'exercise';
  url?: string;
  content?: string;
  category: 'anxiety' | 'depression' | 'stress' | 'relationships' | 'self-care' | 'therapy' | 'meditation' | 'crisis' | 'general';
  tags: string[];
  metadata: {
    views: number;
    likes: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration?: number;
  };
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface CounselorApplication {
  _id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  professionalInfo: {
    licenseNumber?: string;
    licenseState?: string;
    licenseExpiry?: string;
    education: Array<{
      degree: string;
      institution: string;
      graduationYear: number;
      field: string;
    }>;
    experience: Array<{
      position: string;
      organization: string;
      startDate: string;
      endDate?: string;
      responsibilities: string;
    }>;
    specializations: string[];
    languages: string[];
    certifications: Array<{
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate?: string;
    }>;
  };
  documents: Array<{
    type: 'license' | 'diploma' | 'certification' | 'resume' | 'other';
    filename: string;
    url: string;
  }>;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to handle API responses
const handleResponse = <T>(response: any): ApiResponse<T> => {
  if (response.data) {
    return response.data;
  }
  return response;
};

// Auth API
export const authApi = {
  register: async (userData: { 
    username: string; 
    email: string; 
    password: string; 
    fullName: string;
    role?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/register', userData);
    return handleResponse(response);
  },
  
  login: async (credentials: { 
    username?: string;
    email?: string; 
    password: string 
  }): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', credentials);
    return handleResponse(response);
  },
  
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return handleResponse(response);
  },
  
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/profile');
    return handleResponse(response);
  },
  
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/auth/profile', data);
    return handleResponse(response);
  },

  changePassword: async (data: { 
    currentPassword: string; 
    newPassword: string 
  }): Promise<ApiResponse> => {
    const response = await api.put('/auth/change-password', data);
    return handleResponse(response);
  },

  verifyEmail: async (token: string): Promise<ApiResponse> => {
    const response = await api.post(`/auth/verify-email/${token}`);
    return handleResponse(response);
  },

  requestPasswordReset: async (email: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/forgot-password', { email });
    return handleResponse(response);
  },

  resetPassword: async (data: { 
    token: string; 
    password: string 
  }): Promise<ApiResponse> => {
    const response = await api.post('/auth/reset-password', data);
    return handleResponse(response);
  },
};

// User API
export const userApi = {
  searchUsers: async (query: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  },
  
  getUserProfile: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${userId}`);
    return handleResponse(response);
  },
  
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/profile', data);
    return handleResponse(response);
  },
  
  updateAvatar: async (file: File): Promise<ApiResponse<{ avatar: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return handleResponse(response);
  },

  getContacts: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users/contacts');
    return handleResponse(response);
  },
  
  addContact: async (userId: string): Promise<ApiResponse> => {
    const response = await api.post('/users/contacts', { userId });
    return handleResponse(response);
  },
  
  removeContact: async (contactId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/users/contacts/${contactId}`);
    return handleResponse(response);
  },
  
  blockUser: async (userId: string): Promise<ApiResponse> => {
    const response = await api.post('/users/block', { userId });
    return handleResponse(response);
  },
  
  unblockUser: async (userId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/users/block/${userId}`);
    return handleResponse(response);
  },
  
  getBlockedUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users/blocked');
    return handleResponse(response);
  },

  reportUser: async (data: {
    userId: string;
    reason: string;
    description?: string;
  }): Promise<ApiResponse> => {
    const response = await api.post('/users/report', data);
    return handleResponse(response);
  },
};

// Conversations API
export const conversationApi = {
  getConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    const response = await api.get('/messages/conversations');
    return handleResponse(response);
  },

  getConversation: async (conversationId: string): Promise<ApiResponse<Conversation>> => {
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return handleResponse(response);
  },

  createConversation: async (data: {
    participantIds: string[];
    isGroup?: boolean;
    name?: string;
  }): Promise<ApiResponse<Conversation>> => {
    const response = await api.post('/messages/conversations', data);
    return handleResponse(response);
  },

  updateConversation: async (
    conversationId: string,
    data: { name?: string }
  ): Promise<ApiResponse<Conversation>> => {
    const response = await api.put(`/messages/conversations/${conversationId}`, data);
    return handleResponse(response);
  },

  deleteConversation: async (conversationId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/messages/conversations/${conversationId}`);
    return handleResponse(response);
  },
};

// Messages API
export const messageApi = {
  getMessages: async (
    conversationId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<{ messages: Message[]; pagination: any }>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await api.get(
      `/messages/${conversationId}?${searchParams.toString()}`
    );
    return handleResponse(response);
  },
  
  sendMessage: async (data: { 
    conversationId: string; 
    content: string; 
    messageType?: 'text' | 'image' | 'file' | 'voice';
    replyTo?: string;
  }): Promise<ApiResponse<Message>> => {
    const response = await api.post('/messages', data);
    return handleResponse(response);
  },
  
  editMessage: async (messageId: string, content: string): Promise<ApiResponse<Message>> => {
    const response = await api.put(`/messages/${messageId}`, { content });
    return handleResponse(response);
  },
  
  deleteMessage: async (messageId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/messages/${messageId}`);
    return handleResponse(response);
  },
  
  markAsRead: async (messageId: string): Promise<ApiResponse> => {
    const response = await api.put(`/messages/${messageId}/read`);
    return handleResponse(response);
  },
  
  reactToMessage: async (messageId: string, emoji: string): Promise<ApiResponse> => {
    const response = await api.post(`/messages/${messageId}/react`, { emoji });
    return handleResponse(response);
  },

  reportMessage: async (data: {
    messageId: string;
    reason: string;
    description?: string;
  }): Promise<ApiResponse> => {
    const response = await api.post('/messages/report', data);
    return handleResponse(response);
  },
};

// Groups API
export const groupApi = {
  getGroups: async (params?: {
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ groups: Group[]; }>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/groups`);
    return handleResponse(response);
  },
  
  getGroup: async (groupId: string): Promise<ApiResponse<Group>> => {
    const response = await api.get(`/groups/${groupId}`);
    return handleResponse(response);
  },
  
  createGroup: async (data: { 
    name: string; 
    description: string; 
    type: 'support' | 'therapy' | 'general';
    isPublic?: boolean;
  }): Promise<ApiResponse<Group>> => {
    const response = await api.post('/groups', data);
    return handleResponse(response);
  },
  
  updateGroup: async (groupId: string, data: Partial<Group>): Promise<ApiResponse<Group>> => {
    const response = await api.put(`/groups/${groupId}`, data);
    return handleResponse(response);
  },

  deleteGroup: async (groupId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/groups/${groupId}`);
    return handleResponse(response);
  },
  
  joinGroup: async (groupId: string): Promise<ApiResponse> => {
    const response = await api.post(`/groups/${groupId}/join`);
    return handleResponse(response);
  },

  leaveGroup: async (groupId: string): Promise<ApiResponse> => {
    const response = await api.post(`/groups/${groupId}/leave`);
    return handleResponse(response);
  },
  
  getGroupMembers: async (groupId: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(`/groups/${groupId}/members`);
    return handleResponse(response);
  },

  inviteToGroup: async (groupId: string, userIds: string[]): Promise<ApiResponse> => {
    const response = await api.post(`/groups/${groupId}/invite`, { userIds });
    return handleResponse(response);
  },

  removeFromGroup: async (groupId: string, userId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return handleResponse(response);
  },
};

// Notifications API
export const notificationApi = {
  getNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    const response = await api.get('/notifications');
    return handleResponse(response);
  },
  
  markAsRead: async (notificationId: string): Promise<ApiResponse> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return handleResponse(response);
  },
  
  markAllAsRead: async (): Promise<ApiResponse> => {
    const response = await api.put('/notifications/read-all');
    return handleResponse(response);
  },
  
  deleteNotification: async (notificationId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return handleResponse(response);
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get('/notifications/unread-count');
    return handleResponse(response);
  },
};

// Resources API
export const resourceApi = {
  getResources: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    resources: Resource[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/resources`);
    return handleResponse(response);
  },
  
  getResource: async (resourceId: string): Promise<ApiResponse<Resource>> => {
    const response = await api.get(`/resources/${resourceId}`);
    return handleResponse(response);
  },
  
  createResource: async (data: {
    title: string;
    description: string;
    type: string;
    category: string;
    url?: string;
    content?: string;
    tags?: string[];
  }): Promise<ApiResponse<Resource>> => {
    const response = await api.post('/resources', data);
    return handleResponse(response);
  },
  
  updateResource: async (resourceId: string, data: Partial<Resource>): Promise<ApiResponse<Resource>> => {
    const response = await api.put(`/resources/${resourceId}`, data);
    return handleResponse(response);
  },
  
  deleteResource: async (resourceId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/resources/${resourceId}`);
    return handleResponse(response);
  },
  
  likeResource: async (resourceId: string): Promise<ApiResponse> => {
    const response = await api.post(`/resources/${resourceId}/like`);
    return handleResponse(response);
  },
  
  unlikeResource: async (resourceId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/resources/${resourceId}/like`);
    return handleResponse(response);
  },
};

// Counselor API
export const counselorApi = {
  getCounselors: async (params?: {
    specializations?: string[];
    languages?: string[];
    availability?: boolean;
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ counselors: User[]; pagination: any }>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }
    
    const response = await api.get(`/counselors?${searchParams.toString()}`);
    return handleResponse(response);
  },

  getCounselor: async (counselorId: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/counselors/${counselorId}`);
    return handleResponse(response);
  },

  applyToBeCounselor: async (applicationData: Partial<CounselorApplication>): Promise<ApiResponse<CounselorApplication>> => {
    const response = await api.post('/counselors/apply-verification', applicationData);
    return handleResponse(response);
  },

  getMyApplication: async (): Promise<ApiResponse<CounselorApplication>> => {
    const response = await api.get('/counselors/verification-status');
    return handleResponse(response);
  },

  updateApplication: async (applicationData: Partial<CounselorApplication>): Promise<ApiResponse<CounselorApplication>> => {
    const response = await api.put('/counselors/apply-verification', applicationData);
    return handleResponse(response);
  },

  submitApplication: async (): Promise<ApiResponse> => {
    const response = await api.post('/counselors/apply-verification');
    return handleResponse(response);
  },

  getStats: async (): Promise<ApiResponse<{ stats: any }>> => {
    const response = await api.get('/counselors/stats');
    return handleResponse(response);
  },

  // Admin endpoints
  approveCounselor: async (counselorId: string, notes?: string): Promise<ApiResponse> => {
    const response = await api.post(`/counselors/${counselorId}/approve`, { notes });
    return handleResponse(response);
  },

  rejectCounselor: async (counselorId: string, reason: string, notes?: string): Promise<ApiResponse> => {
    const response = await api.post(`/counselors/${counselorId}/reject`, { reason, notes });
    return handleResponse(response);
  },

  getPendingVerifications: async (): Promise<ApiResponse<CounselorApplication[]>> => {
    const response = await api.get('/counselors/pending-verifications');
    return handleResponse(response);
  },

  getCounselorStats: async (): Promise<ApiResponse> => {
    const response = await api.get('/counselors/stats');
    return handleResponse(response);
  },

  uploadDocument: async (file: File, type: string): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);
    
    const response = await api.post('/counselors/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return handleResponse(response);
  },

  updateAvailability: async (isAvailable: boolean): Promise<ApiResponse> => {
    const response = await api.put('/counselors/availability', { isAvailable });
    return handleResponse(response);
  },

  updateSpecializations: async (specializations: string[]): Promise<ApiResponse> => {
    const response = await api.put('/counselors/specializations', { specializations });
    return handleResponse(response);
  },
};

// Crisis API
export const crisisApi = {
  reportCrisis: async (data: {
    messageId?: string;
    description: string;
    urgency: 'low' | 'medium' | 'high' | 'immediate';
    contactInfo?: string;
  }): Promise<ApiResponse> => {
    const response = await api.post('/crisis/report', data);
    return handleResponse(response);
  },

  getCrisisResources: async (): Promise<ApiResponse<Resource[]>> => {
    const response = await api.get('/crisis/resources');
    return handleResponse(response);
  },

  getHelplines: async (country?: string): Promise<ApiResponse> => {
    const searchParams = country ? `?country=${country}` : '';
    const response = await api.get(`/crisis/helplines${searchParams}`);
    return handleResponse(response);
  },
};

// Search API
export const searchApi = {
  searchAll: async (query: string): Promise<ApiResponse<{
    users: User[];
    groups: Group[];
    resources: Resource[];
    messages: Message[];
  }>> => {
    const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  },
  
  searchUsers: async (query: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(`/search/users?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  },
  
  searchGroups: async (query: string): Promise<ApiResponse<Group[]>> => {
    const response = await api.get(`/search/groups?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  },

  searchResources: async (query: string): Promise<ApiResponse<Resource[]>> => {
    const response = await api.get(`/search/resources?q=${encodeURIComponent(query)}`);
    return handleResponse(response);
  },

  searchMessages: async (query: string, conversationId?: string): Promise<ApiResponse<Message[]>> => {
    const searchParams = new URLSearchParams({ q: query });
    if (conversationId) searchParams.append('conversationId', conversationId);
    
    const response = await api.get(`/search/messages?${searchParams.toString()}`);
    return handleResponse(response);
  },
};

// Voice/Video API
export const voiceApi = {
  startCall: async (data: {
    participantIds: string[];
    type: 'voice' | 'video';
  }): Promise<ApiResponse<{ roomId: string; token: string }>> => {
    const response = await api.post('/voice/start', data);
    return handleResponse(response);
  },

  endCall: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.post(`/voice/end/${roomId}`);
    return handleResponse(response);
  },

  getCallHistory: async (): Promise<ApiResponse> => {
    const response = await api.get('/voice/history');
    return handleResponse(response);
  },
};

// Calls API
export const callsApi = {
  initiateCall: async (data: {
    participantIds: string[];
    type: 'voice' | 'video';
  }): Promise<ApiResponse<{ callId: string; token: string }>> => {
    const response = await api.post('/calls/initiate', data);
    return handleResponse(response);
  },

  joinCall: async (callId: string): Promise<ApiResponse> => {
    const response = await api.post(`/calls/${callId}/join`);
    return handleResponse(response);
  },

  leaveCall: async (callId: string): Promise<ApiResponse> => {
    const response = await api.post(`/calls/${callId}/leave`);
    return handleResponse(response);
  },

  endCall: async (callId: string): Promise<ApiResponse> => {
    const response = await api.post(`/calls/${callId}/end`);
    return handleResponse(response);
  },

  updateCallSettings: async (callId: string, settings: any): Promise<ApiResponse> => {
    const response = await api.put(`/calls/${callId}/settings`, settings);
    return handleResponse(response);
  },

  getCallHistory: async (): Promise<ApiResponse> => {
    const response = await api.get('/calls/history');
    return handleResponse(response);
  },

  getActiveCall: async (): Promise<ApiResponse> => {
    const response = await api.get('/calls/active');
    return handleResponse(response);
  },

  submitCallFeedback: async (callId: string, feedback: {
    rating: number;
    comment?: string;
  }): Promise<ApiResponse> => {
    const response = await api.post(`/calls/${callId}/feedback`, feedback);
    return handleResponse(response);
  },

  getCounselorStats: async (): Promise<ApiResponse> => {
    const response = await api.get('/calls/counselor-stats');
    return handleResponse(response);
  },
};

// Moderation API
export const moderationApi = {
  moderateMessage: async (messageId: string, action: {
    action: 'approve' | 'reject' | 'flag';
    reason?: string;
  }): Promise<ApiResponse> => {
    const response = await api.post(`/moderation/messages/${messageId}`, action);
    return handleResponse(response);
  },

  getFlaggedContent: async (): Promise<ApiResponse> => {
    const response = await api.get('/moderation/flagged');
    return handleResponse(response);
  },

  reportContent: async (data: {
    contentId: string;
    contentType: 'message' | 'user' | 'group';
    reason: string;
    description?: string;
  }): Promise<ApiResponse> => {
    const response = await api.post('/moderation/report', data);
    return handleResponse(response);
  },

  blockUser: async (userId: string, reason?: string): Promise<ApiResponse> => {
    const response = await api.post(`/moderation/block/${userId}`, { reason });
    return handleResponse(response);
  },

  unblockUser: async (userId: string): Promise<ApiResponse> => {
    const response = await api.delete(`/moderation/block/${userId}`);
    return handleResponse(response);
  },

  getBlockedUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/moderation/blocked');
    return handleResponse(response);
  },

  panicButton: async (data: {
    location?: string;
    description: string;
  }): Promise<ApiResponse> => {
    const response = await api.post('/moderation/panic', data);
    return handleResponse(response);
  },

  getCrisisResources: async (): Promise<ApiResponse<Resource[]>> => {
    const response = await api.get('/moderation/crisis-resources');
    return handleResponse(response);
  },
};

// Admin API (for admin features accessible to counselors)
export const adminApi = {
  getDashboard: async (): Promise<ApiResponse> => {
    const response = await api.get('/admin/dashboard');
    return handleResponse(response);
  },

  getReports: async (): Promise<ApiResponse> => {
    const response = await api.get('/admin/reports');
    return handleResponse(response);
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<{ users: User[]; pagination: any }>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/admin/users?${searchParams.toString()}`);
    return handleResponse(response);
  },

  getUserDetails: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/admin/users/${userId}`);
    return handleResponse(response);
  },

  banUser: async (userId: string, data: {
    reason: string;
    duration?: number;
  }): Promise<ApiResponse> => {
    const response = await api.post(`/admin/users/${userId}/ban`, data);
    return handleResponse(response);
  },

  unbanUser: async (userId: string): Promise<ApiResponse> => {
    const response = await api.post(`/admin/users/${userId}/unban`);
    return handleResponse(response);
  },

  reviewReport: async (reportId: string, data: {
    action: 'approve' | 'reject' | 'investigate';
    notes?: string;
  }): Promise<ApiResponse> => {
    const response = await api.post(`/admin/reports/${reportId}/review`, data);
    return handleResponse(response);
  },

  getSystemHealth: async (): Promise<ApiResponse> => {
    const response = await api.get('/admin/system-health');
    return handleResponse(response);
  },

  getCrisisAlerts: async (): Promise<ApiResponse> => {
    const response = await api.get('/admin/crisis-alerts');
    return handleResponse(response);
  },

  updateCrisisAlert: async (messageId: string, data: {
    status: 'active' | 'resolved' | 'dismissed';
    notes?: string;
  }): Promise<ApiResponse> => {
    const response = await api.put(`/admin/crisis-alerts/${messageId}`, data);
    return handleResponse(response);
  },
};

export default api;