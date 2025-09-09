import { 
  counselorApi, 
  type User, 
  type CounselorApplication,
  type ApiResponse 
} from '@/lib/api';

// Counselor discovery functions
export const getCounselors = async (params?: {
  specializations?: string[];
  languages?: string[];
  availability?: boolean;
  rating?: number;
  page?: number;
  limit?: number;
}): Promise<{ counselors: User[]; pagination?: any }> => {
  try {
    const response = await counselorApi.getCounselors(params);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return { counselors: [] };
  } catch (error) {
    console.error('Failed to fetch counselors:', error);
    throw error;
  }
};

export const getCounselor = async (counselorId: string): Promise<User | null> => {
  try {
    const response = await counselorApi.getCounselor(counselorId);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch counselor ${counselorId}:`, error);
    throw error;
  }
};

// Counselor application functions
export const applyToBeCounselor = async (applicationData: Partial<CounselorApplication>): Promise<CounselorApplication | null> => {
  try {
    const response = await counselorApi.applyToBeCounselor(applicationData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to submit counselor application:', error);
    throw error;
  }
};

export const getMyApplication = async (): Promise<CounselorApplication | null> => {
  try {
    const response = await counselorApi.getMyApplication();
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch counselor application:', error);
    throw error;
  }
};

export const updateApplication = async (applicationData: Partial<CounselorApplication>): Promise<CounselorApplication | null> => {
  try {
    const response = await counselorApi.updateApplication(applicationData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to update counselor application:', error);
    throw error;
  }
};

export const submitApplication = async (): Promise<boolean> => {
  try {
    const response = await counselorApi.submitApplication();
    return response.success;
  } catch (error) {
    console.error('Failed to submit counselor application:', error);
    throw error;
  }
};

export const uploadDocument = async (file: File, type: string): Promise<string | null> => {
  try {
    const response = await counselorApi.uploadDocument(file, type);
    
    if (response.success && response.data) {
      return response.data.url;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to upload document:', error);
    throw error;
  }
};

// Counselor availability and specializations functions
export const updateAvailability = async (isAvailable: boolean): Promise<boolean> => {
  try {
    const response = await counselorApi.updateAvailability(isAvailable);
    return response.success;
  } catch (error) {
    console.error('Failed to update availability:', error);
    throw error;
  }
};

export const updateSpecializations = async (specializations: string[]): Promise<boolean> => {
  try {
    const response = await counselorApi.updateSpecializations(specializations);
    return response.success;
  } catch (error) {
    console.error('Failed to update specializations:', error);
    throw error;
  }
};

// Admin functions for counselor management
export const approveCounselor = async (counselorId: string, notes?: string): Promise<boolean> => {
  try {
    const response = await counselorApi.approveCounselor(counselorId, notes);
    return response.success;
  } catch (error) {
    console.error(`Failed to approve counselor ${counselorId}:`, error);
    throw error;
  }
};

export const rejectCounselor = async (counselorId: string, reason: string, notes?: string): Promise<boolean> => {
  try {
    const response = await counselorApi.rejectCounselor(counselorId, reason, notes);
    return response.success;
  } catch (error) {
    console.error(`Failed to reject counselor ${counselorId}:`, error);
    throw error;
  }
};

export const getPendingVerifications = async (): Promise<CounselorApplication[]> => {
  try {
    const response = await counselorApi.getPendingVerifications();

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch pending verifications:', error);
    throw error;
  }
};

export const getCounselorStats = async (): Promise<any | null> => {
  try {
    const response = await counselorApi.getCounselorStats();

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch counselor stats:', error);
    throw error;
  }
};

// Utility functions
export const isCounselor = (user: User): boolean => {
  return user.role === 'counselor';
};

export const isVerifiedCounselor = (user: User): boolean => {
  return user.role === 'counselor' && user.counselorInfo?.isVerified === true;
};

export const getCounselorRating = (user: User): number => {
  return user.counselorInfo?.rating || 0;
};

export const getCounselorSessionCount = (user: User): number => {
  return user.counselorInfo?.totalSessions || 0;
};

export const getCounselorSpecializations = (user: User): string[] => {
  return user.counselorInfo?.specializations || [];
};

export const getCounselorLanguages = (user: User): string[] => {
  return user.profile?.languages || [];
};

export const isCounselorAvailable = (user: User): boolean => {
  return user.counselorInfo?.availabilityStatus === true;
};

export const getCounselorVerificationStatus = (user: User): string => {
  return user.counselorInfo?.verificationStatus || 'pending';
};

export const formatCounselorRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const getCounselorBadgeColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-blue-600';
  if (rating >= 3.5) return 'text-yellow-600';
  return 'text-gray-600';
};

export const getApplicationStatusDisplayName = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'submitted':
      return 'Under Review';
    case 'under_review':
      return 'Under Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
};

export const getApplicationStatusColor = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'text-gray-600';
    case 'submitted':
    case 'under_review':
      return 'text-yellow-600';
    case 'approved':
      return 'text-green-600';
    case 'rejected':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const calculateApplicationProgress = (application: CounselorApplication): number => {
  let completedSections = 0;
  let totalSections = 4; // Adjust based on your application structure
  
  // Check personal info completion
  if (application.personalInfo?.firstName && 
      application.personalInfo?.lastName &&
      application.personalInfo?.phone) {
    completedSections++;
  }
  
  // Check professional info completion
  if (application.professionalInfo?.education?.length > 0 &&
      application.professionalInfo?.specializations?.length > 0) {
    completedSections++;
  }
  
  // Check documents uploaded
  if (application.documents?.length > 0) {
    completedSections++;
  }
  
  // Check if submitted
  if (application.status !== 'draft') {
    completedSections++;
  }
  
  return Math.round((completedSections / totalSections) * 100);
};

export const sortCounselorsByRating = (counselors: User[]): User[] => {
  return [...counselors].sort((a, b) => {
    const ratingA = a.counselorInfo?.rating || 0;
    const ratingB = b.counselorInfo?.rating || 0;
    return ratingB - ratingA;
  });
};

export const sortCounselorsByExperience = (counselors: User[]): User[] => {
  return [...counselors].sort((a, b) => {
    const sessionsA = a.counselorInfo?.totalSessions || 0;
    const sessionsB = b.counselorInfo?.totalSessions || 0;
    return sessionsB - sessionsA;
  });
};

export const filterCounselorsBySpecialization = (counselors: User[], specialization: string): User[] => {
  return counselors.filter(counselor => 
    counselor.counselorInfo?.specializations?.includes(specialization)
  );
};

export const filterCounselorsByLanguage = (counselors: User[], language: string): User[] => {
  return counselors.filter(counselor => 
    counselor.profile?.languages?.includes(language)
  );
};

export const filterAvailableCounselors = (counselors: User[]): User[] => {
  return counselors.filter(counselor => 
    counselor.counselorInfo?.availabilityStatus === true
  );
};

export const searchCounselors = (counselors: User[], query: string): User[] => {
  const lowercaseQuery = query.toLowerCase();
  return counselors.filter(counselor => {
    const displayName = (counselor.profile?.displayName || counselor.fullName || counselor.username).toLowerCase();
    const specializations = counselor.counselorInfo?.specializations?.join(' ').toLowerCase() || '';
    const bio = (counselor.profile?.bio || counselor.bio || '').toLowerCase();
    
    return displayName.includes(lowercaseQuery) ||
           specializations.includes(lowercaseQuery) ||
           bio.includes(lowercaseQuery);
  });
};

// Document type helpers
export const getDocumentTypeDisplayName = (type: string): string => {
  switch (type) {
    case 'license':
      return 'Professional License';
    case 'diploma':
      return 'Diploma/Degree';
    case 'certification':
      return 'Certification';
    case 'resume':
      return 'Resume/CV';
    case 'other':
      return 'Other Document';
    default:
      return 'Document';
  }
};

export const getDocumentTypeIcon = (type: string): string => {
  switch (type) {
    case 'license':
      return '📜';
    case 'diploma':
      return '🎓';
    case 'certification':
      return '🏆';
    case 'resume':
      return '📄';
    case 'other':
      return '📋';
    default:
      return '📎';
  }
};

// Export types for backward compatibility
export type { User, CounselorApplication };