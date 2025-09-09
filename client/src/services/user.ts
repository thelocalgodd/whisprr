import { userApi, authApi, type User, type ApiResponse } from '@/lib/api';

// User profile functions
export const getProfile = async (): Promise<User | null> => {
  try {
    const response = await authApi.getProfile();
    
    if (response.success && response.data) {
      // Update stored user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw error;
  }
};

export const updateProfile = async (profileData: Partial<User>): Promise<User | null> => {
  try {
    const response = await userApi.updateProfile(profileData);
    
    if (response.success && response.data) {
      // Update stored user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

export const changePassword = async (passwordData: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await authApi.changePassword(passwordData);
    
    return {
      success: response.success,
      message: response.message || 'Password changed successfully',
    };
  } catch (error) {
    console.error('Failed to change password:', error);
    throw error;
  }
};

// User search and management
export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const response = await userApi.searchUsers(query);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to search users:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const response = await userApi.getUserProfile(userId);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch user profile for ${userId}:`, error);
    throw error;
  }
};

// Avatar management
export const updateAvatar = async (file: File): Promise<string | null> => {
  try {
    const response = await userApi.updateAvatar(file);
    
    if (response.success && response.data) {
      return response.data.avatar;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to update avatar:', error);
    throw error;
  }
};

// Contact management
export const getContacts = async (): Promise<User[]> => {
  try {
    const response = await userApi.getContacts();
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    throw error;
  }
};

export const addContact = async (userId: string): Promise<boolean> => {
  try {
    const response = await userApi.addContact(userId);
    return response.success;
  } catch (error) {
    console.error(`Failed to add contact ${userId}:`, error);
    throw error;
  }
};

export const removeContact = async (contactId: string): Promise<boolean> => {
  try {
    const response = await userApi.removeContact(contactId);
    return response.success;
  } catch (error) {
    console.error(`Failed to remove contact ${contactId}:`, error);
    throw error;
  }
};

// Block/unblock functionality
export const blockUser = async (userId: string): Promise<boolean> => {
  try {
    const response = await userApi.blockUser(userId);
    return response.success;
  } catch (error) {
    console.error(`Failed to block user ${userId}:`, error);
    throw error;
  }
};

export const unblockUser = async (userId: string): Promise<boolean> => {
  try {
    const response = await userApi.unblockUser(userId);
    return response.success;
  } catch (error) {
    console.error(`Failed to unblock user ${userId}:`, error);
    throw error;
  }
};

export const getBlockedUsers = async (): Promise<User[]> => {
  try {
    const response = await userApi.getBlockedUsers();
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch blocked users:', error);
    throw error;
  }
};

// Report functionality
export const reportUser = async (data: {
  userId: string;
  reason: string;
  description?: string;
}): Promise<boolean> => {
  try {
    const response = await userApi.reportUser(data);
    return response.success;
  } catch (error) {
    console.error(`Failed to report user ${data.userId}:`, error);
    throw error;
  }
};

// Utility functions
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isUserOnline = (user: User): boolean => {
  return user.isOnline;
};

export const getUserRole = (user: User): string => {
  return user.role;
};

export const isUserVerified = (user: User): boolean => {
  return user.isVerified;
};

export const getUserDisplayName = (user: User): string => {
  return user.profile?.displayName || user.fullName || user.username;
};

export const getUserAvatar = (user: User): string | undefined => {
  return user.profile?.avatar || user.avatar;
};

// Export types for backward compatibility
export type { User };