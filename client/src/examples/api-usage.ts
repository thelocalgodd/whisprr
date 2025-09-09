/**
 * API Usage Examples
 * 
 * This file demonstrates how to use the various API endpoints
 * in the Whisprr client application.
 */

import {
  // Authentication
  Login,
  Register,
  Logout,
  GetProfile,
  
  // User management
  searchUsers,
  getUserProfile,
  updateProfile,
  addContact,
  blockUser,
  
  // Conversations and messaging
  getConversations,
  sendMessage,
  getMessages,
  
  // Groups
  getGroups,
  joinGroup,
  createGroup,
  sendGroupMessage,
  
  // Resources
  getResources,
  getCrisisResources,
  likeResource,
  
  // Counselors
  getCounselors,
  applyToBeCounselor,
  updateAvailability,
  
  // Notifications
  getNotifications,
  markAllNotificationsAsRead,
  searchAll,
  
  // Types
  type User,
  type Group,
  type Resource,
  type Conversation,
  type Message,
} from '../services';

// Authentication Examples
export const authExamples = {
  // Login with username or email
  login: async (usernameOrEmail: string, password: string) => {
    try {
      const response = await Login(usernameOrEmail, password);
      if (response.success) {
        console.log('Login successful:', response.user);
        // Token is automatically stored in localStorage
        return response.user;
      } else {
        console.error('Login failed:', response.message);
        return null;
      }
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  // Register new user
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role?: string;
  }) => {
    try {
      const response = await Register(
        userData.username,
        userData.email,
        userData.password,
        userData.fullName,
        userData.role || 'user'
      );
      console.log('Registration successful:', response.user);
      return response.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Get current user profile
  getCurrentProfile: async () => {
    try {
      const user = await GetProfile();
      if (user) {
        console.log('Current user:', user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await Logout();
      console.log('Logout:', response.message);
      // Redirect to login page or home
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};

// User Management Examples
export const userExamples = {
  // Search for users
  findUsers: async (query: string) => {
    try {
      const users = await searchUsers(query);
      console.log('Found users:', users);
      return users;
    } catch (error) {
      console.error('User search error:', error);
      return [];
    }
  },

  // Get a user's profile
  viewUserProfile: async (userId: string) => {
    try {
      const user = await getUserProfile(userId);
      if (user) {
        console.log('User profile:', user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  },

  // Update current user's profile
  updateMyProfile: async (updates: Partial<User>) => {
    try {
      const updatedUser = await updateProfile(updates);
      if (updatedUser) {
        console.log('Profile updated:', updatedUser);
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error('Profile update error:', error);
      return null;
    }
  },

  // Add user as contact
  addUserContact: async (userId: string) => {
    try {
      const success = await addContact(userId);
      if (success) {
        console.log('Contact added successfully');
      }
      return success;
    } catch (error) {
      console.error('Add contact error:', error);
      return false;
    }
  }
};

// Messaging Examples
export const messagingExamples = {
  // Get all conversations
  loadConversations: async () => {
    try {
      const conversations = await getConversations();
      console.log('Conversations:', conversations);
      return conversations;
    } catch (error) {
      console.error('Conversations fetch error:', error);
      return [];
    }
  },

  // Get messages for a conversation
  loadMessages: async (conversationId: string, page = 1) => {
    try {
      const result = await getMessages(conversationId, { page, limit: 50 });
      console.log('Messages:', result.messages);
      return result;
    } catch (error) {
      console.error('Messages fetch error:', error);
      return { messages: [] };
    }
  },

  // Send a text message
  sendTextMessage: async (conversationId: string, content: string) => {
    try {
      const message = await sendMessage(conversationId, content);
      if (message) {
        console.log('Message sent:', message);
        return message;
      }
      return null;
    } catch (error) {
      console.error('Send message error:', error);
      return null;
    }
  }
};

// Group Examples
export const groupExamples = {
  // Get available groups
  browseGroups: async (type?: string) => {
    try {
      const result = await getGroups({ type, limit: 20 });
      console.log('Available groups:', result.groups);
      return result.groups;
    } catch (error) {
      console.error('Groups fetch error:', error);
      return [];
    }
  },

  // Create a new group
  createSupportGroup: async (name: string, description: string) => {
    try {
      const group = await createGroup({
        name,
        description,
        type: 'support',
        isPublic: true
      });
      if (group) {
        console.log('Group created:', group);
        return group;
      }
      return null;
    } catch (error) {
      console.error('Group creation error:', error);
      return null;
    }
  },

  // Join a group
  joinSupportGroup: async (groupId: string) => {
    try {
      const success = await joinGroup(groupId);
      if (success) {
        console.log('Successfully joined group');
      }
      return success;
    } catch (error) {
      console.error('Join group error:', error);
      return false;
    }
  },

  // Send message to group
  sendGroupMessage: async (groupId: string, content: string) => {
    try {
      const message = await sendGroupMessage(groupId, content);
      if (message) {
        console.log('Group message sent:', message);
        return message;
      }
      return null;
    } catch (error) {
      console.error('Group message error:', error);
      return null;
    }
  }
};

// Resource Examples
export const resourceExamples = {
  // Browse resources
  browseResources: async (category?: string) => {
    try {
      const result = await getResources({ category, limit: 20 });
      console.log('Resources:', result.resources);
      return result.resources;
    } catch (error) {
      console.error('Resources fetch error:', error);
      return [];
    }
  },

  // Get crisis resources
  getCrisisHelp: async () => {
    try {
      const resources = await getCrisisResources();
      console.log('Crisis resources:', resources);
      return resources;
    } catch (error) {
      console.error('Crisis resources error:', error);
      return [];
    }
  },

  // Like a resource
  likeHelpfulResource: async (resourceId: string) => {
    try {
      const success = await likeResource(resourceId);
      if (success) {
        console.log('Resource liked');
      }
      return success;
    } catch (error) {
      console.error('Like resource error:', error);
      return false;
    }
  }
};

// Counselor Examples
export const counselorExamples = {
  // Find counselors
  findCounselors: async (specialization?: string) => {
    try {
      const result = await getCounselors({
        specializations: specialization ? [specialization] : undefined,
        availability: true,
        limit: 10
      });
      console.log('Available counselors:', result.counselors);
      return result.counselors;
    } catch (error) {
      console.error('Counselors fetch error:', error);
      return [];
    }
  },

  // Apply to become a counselor
  becomeCounselor: async () => {
    try {
      const application = await applyToBeCounselor({
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          dateOfBirth: '1990-01-01',
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            country: 'USA'
          }
        },
        professionalInfo: {
          education: [{
            degree: 'Masters in Psychology',
            institution: 'University Name',
            graduationYear: 2015,
            field: 'Clinical Psychology'
          }],
          specializations: ['Anxiety', 'Depression'],
          languages: ['English', 'Spanish'],
          experience: [{
            position: 'Licensed Therapist',
            organization: 'Mental Health Clinic',
            startDate: '2015-06-01',
            responsibilities: 'Individual and group therapy sessions'
          }],
          certifications: []
        },
        documents: [],
        status: 'draft'
      });
      
      if (application) {
        console.log('Application created:', application);
        return application;
      }
      return null;
    } catch (error) {
      console.error('Counselor application error:', error);
      return null;
    }
  },

  // Update counselor availability
  toggleAvailability: async (isAvailable: boolean) => {
    try {
      const success = await updateAvailability(isAvailable);
      if (success) {
        console.log(`Availability set to: ${isAvailable ? 'available' : 'unavailable'}`);
      }
      return success;
    } catch (error) {
      console.error('Availability update error:', error);
      return false;
    }
  }
};

// Notification Examples
export const notificationExamples = {
  // Get notifications
  loadNotifications: async () => {
    try {
      const notifications = await getNotifications();
      console.log('Notifications:', notifications);
      return notifications;
    } catch (error) {
      console.error('Notifications fetch error:', error);
      return [];
    }
  },

  // Mark all as read
  clearNotifications: async () => {
    try {
      const success = await markAllNotificationsAsRead();
      if (success) {
        console.log('All notifications marked as read');
      }
      return success;
    } catch (error) {
      console.error('Clear notifications error:', error);
      return false;
    }
  },

  // Global search
  performSearch: async (query: string) => {
    try {
      const results = await searchAll(query);
      console.log('Search results:', results);
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return { users: [], groups: [], resources: [], messages: [] };
    }
  }
};

// Complete usage example
export const completeExample = async () => {
  console.log('=== Whisprr API Usage Example ===');
  
  try {
    // 1. Login
    console.log('\n1. Logging in...');
    const user = await authExamples.login('john@example.com', 'password123');
    if (!user) {
      console.log('Login failed, stopping example');
      return;
    }
    
    // 2. Load user's conversations
    console.log('\n2. Loading conversations...');
    const conversations = await messagingExamples.loadConversations();
    
    // 3. Browse available groups
    console.log('\n3. Browsing support groups...');
    const groups = await groupExamples.browseGroups('support');
    
    // 4. Get helpful resources
    console.log('\n4. Loading resources...');
    const resources = await resourceExamples.browseResources('anxiety');
    
    // 5. Find counselors
    console.log('\n5. Finding counselors...');
    const counselors = await counselorExamples.findCounselors('Anxiety');
    
    // 6. Check notifications
    console.log('\n6. Checking notifications...');
    const notifications = await notificationExamples.loadNotifications();
    
    console.log('\n=== Example completed successfully ===');
    
  } catch (error) {
    console.error('Example error:', error);
  }
};

export default {
  authExamples,
  userExamples,
  messagingExamples,
  groupExamples,
  resourceExamples,
  counselorExamples,
  notificationExamples,
  completeExample
};