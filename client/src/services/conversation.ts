import { 
  conversationApi, 
  messageApi, 
  type Conversation, 
  type Message, 
  type ApiResponse 
} from '@/lib/api';

// Fetch all conversations
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await conversationApi.getConversations();
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    throw error;
  }
};

// Fetch a specific conversation
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const response = await conversationApi.getConversation(conversationId);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch conversation ${conversationId}:`, error);
    throw error;
  }
};

// Create a new conversation
export const createConversation = async (data: {
  participantIds: string[];
  isGroup?: boolean;
  name?: string;
}): Promise<Conversation | null> => {
  try {
    const response = await conversationApi.createConversation(data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to create conversation:', error);
    throw error;
  }
};

// Update conversation (e.g., change name)
export const updateConversation = async (
  conversationId: string, 
  data: { name?: string }
): Promise<Conversation | null> => {
  try {
    const response = await conversationApi.updateConversation(conversationId, data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to update conversation ${conversationId}:`, error);
    throw error;
  }
};

// Delete a conversation
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const response = await conversationApi.deleteConversation(conversationId);
    return response.success;
  } catch (error) {
    console.error(`Failed to delete conversation ${conversationId}:`, error);
    throw error;
  }
};

// Fetch messages for a specific conversation
export const getMessages = async (
  conversationId: string,
  params?: { page?: number; limit?: number }
): Promise<{ messages: Message[]; pagination?: any }> => {
  try {
    const response = await messageApi.getMessages(conversationId, params);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return { messages: [] };
  } catch (error) {
    console.error(`Failed to fetch messages for conversation ${conversationId}:`, error);
    throw error;
  }
};

// Send a new message
export const sendMessage = async (
  conversationId: string, 
  content: string,
  options?: {
    messageType?: 'text' | 'image' | 'file' | 'voice';
    replyTo?: string;
  }
): Promise<Message | null> => {
  try {
    const response = await messageApi.sendMessage({
      conversationId,
      content,
      messageType: options?.messageType || 'text',
      replyTo: options?.replyTo,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

// Edit a message
export const editMessage = async (messageId: string, content: string): Promise<Message | null> => {
  try {
    const response = await messageApi.editMessage(messageId, content);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to edit message ${messageId}:`, error);
    throw error;
  }
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    const response = await messageApi.deleteMessage(messageId);
    return response.success;
  } catch (error) {
    console.error(`Failed to delete message ${messageId}:`, error);
    throw error;
  }
};

// Mark message as read
export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const response = await messageApi.markAsRead(messageId);
    return response.success;
  } catch (error) {
    console.error(`Failed to mark message ${messageId} as read:`, error);
    throw error;
  }
};

// React to a message
export const reactToMessage = async (messageId: string, emoji: string): Promise<boolean> => {
  try {
    const response = await messageApi.reactToMessage(messageId, emoji);
    return response.success;
  } catch (error) {
    console.error(`Failed to react to message ${messageId}:`, error);
    throw error;
  }
};

// Report a message
export const reportMessage = async (data: {
  messageId: string;
  reason: string;
  description?: string;
}): Promise<boolean> => {
  try {
    const response = await messageApi.reportMessage(data);
    return response.success;
  } catch (error) {
    console.error(`Failed to report message ${data.messageId}:`, error);
    throw error;
  }
};

// Utility functions
export const isGroupConversation = (conversation: Conversation): boolean => {
  return conversation.isGroup;
};

export const getConversationDisplayName = (conversation: Conversation, currentUserId: string): string => {
  if (conversation.name) {
    return conversation.name;
  }
  
  if (conversation.isGroup) {
    return `Group with ${conversation.participants.length} members`;
  }
  
  // For 1-on-1 conversations, get the other participant's name
  const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
  return otherParticipant?.profile?.displayName || otherParticipant?.fullName || otherParticipant?.username || 'Unknown User';
};

export const getConversationAvatar = (conversation: Conversation, currentUserId: string): string | undefined => {
  if (conversation.isGroup) {
    return undefined; // Groups might have their own avatar logic
  }
  
  // For 1-on-1 conversations, get the other participant's avatar
  const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
  return otherParticipant?.profile?.avatar || otherParticipant?.avatar;
};

export const getLastMessagePreview = (message: Message | undefined): string => {
  if (!message) return 'No messages yet';
  
  if (message.messageType === 'text') {
    return message.content.text;
  } else if (message.messageType === 'image') {
    return '📷 Image';
  } else if (message.messageType === 'file') {
    return '📎 File';
  } else if (message.messageType === 'voice') {
    return '🎤 Voice message';
  } else {
    return 'Message';
  }
};

export const formatMessageTime = (timestamp: string): string => {
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

export const sortConversationsByLastMessage = (conversations: Conversation[]): Conversation[] => {
  return [...conversations].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.updatedAt;
    const bTime = b.lastMessage?.createdAt || b.updatedAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
};

// Export types for backward compatibility
export type { Conversation, Message };