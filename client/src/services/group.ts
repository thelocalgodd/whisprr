import { 
  groupApi, 
  messageApi,
  type Group, 
  type User, 
  type Message,
  type ApiResponse 
} from '@/lib/api';

// Group management functions
export const getGroups = async (params?: {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ groups: Group[]; pagination?: any }> => {
  try {
    const response = await groupApi.getGroups(params);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return { groups: [] };
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    throw error;
  }
};

export const getGroup = async (groupId: string): Promise<Group | null> => {
  try {
    const response = await groupApi.getGroup(groupId);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch group ${groupId}:`, error);
    throw error;
  }
};

export const createGroup = async (data: { 
  name: string; 
  description: string; 
  type: 'support' | 'therapy' | 'general';
  isPublic?: boolean;
}): Promise<Group | null> => {
  try {
    const response = await groupApi.createGroup(data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to create group:', error);
    throw error;
  }
};

export const updateGroup = async (groupId: string, data: Partial<Group>): Promise<Group | null> => {
  try {
    const response = await groupApi.updateGroup(groupId, data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to update group ${groupId}:`, error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string): Promise<boolean> => {
  try {
    const response = await groupApi.deleteGroup(groupId);
    return response.success;
  } catch (error) {
    console.error(`Failed to delete group ${groupId}:`, error);
    throw error;
  }
};

// Group membership functions
export const joinGroup = async (groupId: string): Promise<boolean> => {
  try {
    const response = await groupApi.joinGroup(groupId);
    return response.success;
  } catch (error) {
    console.error(`Failed to join group ${groupId}:`, error);
    throw error;
  }
};

export const leaveGroup = async (groupId: string): Promise<boolean> => {
  try {
    const response = await groupApi.leaveGroup(groupId);
    return response.success;
  } catch (error) {
    console.error(`Failed to leave group ${groupId}:`, error);
    throw error;
  }
};

export const getGroupMembers = async (groupId: string): Promise<User[]> => {
  try {
    const response = await groupApi.getGroupMembers(groupId);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error(`Failed to fetch members for group ${groupId}:`, error);
    throw error;
  }
};

export const inviteToGroup = async (groupId: string, userIds: string[]): Promise<boolean> => {
  try {
    const response = await groupApi.inviteToGroup(groupId, userIds);
    return response.success;
  } catch (error) {
    console.error(`Failed to invite users to group ${groupId}:`, error);
    throw error;
  }
};

export const removeFromGroup = async (groupId: string, userId: string): Promise<boolean> => {
  try {
    const response = await groupApi.removeFromGroup(groupId, userId);
    return response.success;
  } catch (error) {
    console.error(`Failed to remove user ${userId} from group ${groupId}:`, error);
    throw error;
  }
};

// Group messaging functions (assuming groups use conversations)
export const getGroupMessages = async (
  groupId: string,
  params?: { page?: number; limit?: number }
): Promise<{ messages: Message[]; pagination?: any }> => {
  try {
    const response = await messageApi.getMessages(groupId, params);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return { messages: [] };
  } catch (error) {
    console.error(`Failed to fetch messages for group ${groupId}:`, error);
    throw error;
  }
};

export const sendGroupMessage = async (
  groupId: string,
  content: string,
  options?: {
    messageType?: 'text' | 'image' | 'file' | 'voice';
    replyTo?: string;
  }
): Promise<Message | null> => {
  try {
    const response = await messageApi.sendMessage({
      conversationId: groupId, // Groups use conversation ID structure
      content,
      messageType: options?.messageType || 'text',
      replyTo: options?.replyTo,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to send message to group ${groupId}:`, error);
    throw error;
  }
};

// Utility functions
export const isUserGroupMember = (group: Group, userId: string): boolean => {
  // This would need to be implemented based on how group membership is stored
  // For now, we'll assume you need to fetch members separately
  return false;
};

export const isUserGroupModerator = (group: Group, userId: string): boolean => {
  return group.moderators?.some(mod => mod._id === userId) || false;
};

export const isUserGroupCreator = (group: Group, userId: string): boolean => {
  return group.createdBy._id === userId;
};

export const getGroupTypeDisplayName = (type: string): string => {
  switch (type) {
    case 'support':
      return 'Support Group';
    case 'therapy':
      return 'Therapy Group';
    case 'general':
      return 'General Discussion';
    default:
      return 'Group';
  }
};

export const getGroupIcon = (type: string): string => {
  switch (type) {
    case 'support':
      return '🤝';
    case 'therapy':
      return '💙';
    case 'general':
      return '💬';
    default:
      return '👥';
  }
};

export const formatGroupMemberCount = (count: number): string => {
  if (count === 1) return '1 member';
  if (count < 1000) return `${count} members`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k members`;
  return `${(count / 1000000).toFixed(1)}M members`;
};

export const sortGroupsByActivity = (groups: Group[]): Group[] => {
  return [...groups].sort((a, b) => {
    return b.statistics.activeMembers - a.statistics.activeMembers;
  });
};

export const sortGroupsByMembers = (groups: Group[]): Group[] => {
  return [...groups].sort((a, b) => {
    return b.statistics.totalMembers - a.statistics.totalMembers;
  });
};

export const sortGroupsByRecent = (groups: Group[]): Group[] => {
  return [...groups].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
};

export const filterGroupsByType = (groups: Group[], type: string): Group[] => {
  return groups.filter(group => group.type === type);
};

export const searchGroups = (groups: Group[], query: string): Group[] => {
  const lowercaseQuery = query.toLowerCase();
  return groups.filter(group => 
    group.name.toLowerCase().includes(lowercaseQuery) ||
    group.description.toLowerCase().includes(lowercaseQuery)
  );
};

// Export types for backward compatibility
export type { Group, User, Message };