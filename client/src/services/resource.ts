import { 
  resourceApi, 
  crisisApi,
  type Resource, 
  type ApiResponse 
} from '@/lib/api';

// Resource management functions
export const getResources = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  resources: Resource[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> => {
  try {
    const response = await resourceApi.getResources(params);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return {
      resources: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 }
    };
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    throw error;
  }
};

export const getResource = async (resourceId: string): Promise<Resource | null> => {
  try {
    const response = await resourceApi.getResource(resourceId);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch resource ${resourceId}:`, error);
    throw error;
  }
};

export const createResource = async (data: {
  title: string;
  description: string;
  type: string;
  category: string;
  url?: string;
  content?: string;
  tags?: string[];
}): Promise<Resource | null> => {
  try {
    const response = await resourceApi.createResource(data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to create resource:', error);
    throw error;
  }
};

export const updateResource = async (resourceId: string, data: Partial<Resource>): Promise<Resource | null> => {
  try {
    const response = await resourceApi.updateResource(resourceId, data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to update resource ${resourceId}:`, error);
    throw error;
  }
};

export const deleteResource = async (resourceId: string): Promise<boolean> => {
  try {
    const response = await resourceApi.deleteResource(resourceId);
    return response.success;
  } catch (error) {
    console.error(`Failed to delete resource ${resourceId}:`, error);
    throw error;
  }
};

// Resource interaction functions
export const likeResource = async (resourceId: string): Promise<boolean> => {
  try {
    const response = await resourceApi.likeResource(resourceId);
    return response.success;
  } catch (error) {
    console.error(`Failed to like resource ${resourceId}:`, error);
    throw error;
  }
};

export const unlikeResource = async (resourceId: string): Promise<boolean> => {
  try {
    const response = await resourceApi.unlikeResource(resourceId);
    return response.success;
  } catch (error) {
    console.error(`Failed to unlike resource ${resourceId}:`, error);
    throw error;
  }
};

// Crisis-specific resource functions
export const getCrisisResources = async (): Promise<Resource[]> => {
  try {
    const response = await crisisApi.getCrisisResources();
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch crisis resources:', error);
    throw error;
  }
};

export const getCrisisHelplines = async (country?: string): Promise<any[]> => {
  try {
    const response = await crisisApi.getHelplines(country);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch crisis helplines:', error);
    throw error;
  }
};

export const reportCrisis = async (data: {
  messageId?: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  contactInfo?: string;
}): Promise<boolean> => {
  try {
    const response = await crisisApi.reportCrisis(data);
    return response.success;
  } catch (error) {
    console.error('Failed to report crisis:', error);
    throw error;
  }
};

// Utility functions
export const getResourceTypeDisplayName = (type: string): string => {
  switch (type) {
    case 'article':
      return 'Article';
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'pdf':
      return 'PDF Document';
    case 'link':
      return 'External Link';
    case 'tool':
      return 'Tool';
    case 'exercise':
      return 'Exercise';
    default:
      return 'Resource';
  }
};

export const getResourceTypeIcon = (type: string): string => {
  switch (type) {
    case 'article':
      return '📄';
    case 'video':
      return '🎥';
    case 'audio':
      return '🎵';
    case 'pdf':
      return '📋';
    case 'link':
      return '🔗';
    case 'tool':
      return '🛠️';
    case 'exercise':
      return '💪';
    default:
      return '📚';
  }
};

export const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case 'anxiety':
      return 'Anxiety';
    case 'depression':
      return 'Depression';
    case 'stress':
      return 'Stress Management';
    case 'relationships':
      return 'Relationships';
    case 'self-care':
      return 'Self Care';
    case 'therapy':
      return 'Therapy';
    case 'meditation':
      return 'Meditation';
    case 'crisis':
      return 'Crisis Support';
    case 'general':
      return 'General';
    default:
      return 'Other';
  }
};

export const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'anxiety':
      return '😰';
    case 'depression':
      return '😔';
    case 'stress':
      return '😤';
    case 'relationships':
      return '💝';
    case 'self-care':
      return '🌿';
    case 'therapy':
      return '🗣️';
    case 'meditation':
      return '🧘';
    case 'crisis':
      return '🆘';
    case 'general':
      return '💭';
    default:
      return '📖';
  }
};

export const getDifficultyDisplayName = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner':
      return 'Beginner';
    case 'intermediate':
      return 'Intermediate';
    case 'advanced':
      return 'Advanced';
    default:
      return 'All Levels';
  }
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner':
      return 'text-green-600';
    case 'intermediate':
      return 'text-yellow-600';
    case 'advanced':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const formatDuration = (duration?: number): string => {
  if (!duration) return '';
  
  if (duration < 60) {
    return `${duration} min`;
  } else if (duration < 3600) {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    const hours = Math.floor(duration / 60);
    return `${hours}+ hours`;
  }
};

export const formatViewCount = (views: number): string => {
  if (views < 1000) return views.toString();
  if (views < 1000000) return `${(views / 1000).toFixed(1)}k`;
  return `${(views / 1000000).toFixed(1)}M`;
};

export const sortResourcesByPopularity = (resources: Resource[]): Resource[] => {
  return [...resources].sort((a, b) => {
    return b.metadata.views - a.metadata.views;
  });
};

export const sortResourcesByLikes = (resources: Resource[]): Resource[] => {
  return [...resources].sort((a, b) => {
    return b.metadata.likes - a.metadata.likes;
  });
};

export const sortResourcesByDate = (resources: Resource[]): Resource[] => {
  return [...resources].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const filterResourcesByType = (resources: Resource[], type: string): Resource[] => {
  return resources.filter(resource => resource.type === type);
};

export const filterResourcesByCategory = (resources: Resource[], category: string): Resource[] => {
  return resources.filter(resource => resource.category === category);
};

export const filterResourcesByDifficulty = (resources: Resource[], difficulty: string): Resource[] => {
  return resources.filter(resource => resource.metadata.difficulty === difficulty);
};

export const searchResources = (resources: Resource[], query: string): Resource[] => {
  const lowercaseQuery = query.toLowerCase();
  return resources.filter(resource => 
    resource.title.toLowerCase().includes(lowercaseQuery) ||
    resource.description.toLowerCase().includes(lowercaseQuery) ||
    resource.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getRelatedResources = (resource: Resource, allResources: Resource[], limit = 5): Resource[] => {
  return allResources
    .filter(r => r._id !== resource._id && r.category === resource.category)
    .slice(0, limit);
};

// Export types for backward compatibility
export type { Resource };