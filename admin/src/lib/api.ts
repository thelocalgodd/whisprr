import axios, { AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = "https://whisprr-api.onrender.com"

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Generic API response handler
const handleApiResponse = async <T>(apiCall: () => Promise<AxiosResponse<T>>) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'An error occurred';
      throw new Error(message);
    }
    throw error;
  }
};

// Dashboard Analytics API
export const dashboardApi = {
  getAnalytics: () => 
    handleApiResponse(() => api.get('/admin/dashboard')),
};

// User Management API
export const userApi = {
  getUsers: (params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    return handleApiResponse(() => 
      api.get(`/admin/users${queryString ? `?${queryString}` : ''}`)
    );
  },
  
  getUserById: (userId: string) => 
    handleApiResponse(() => api.get(`/admin/users/${userId}`)),
  
  updateUserStatus: (userId: string, data: { isActive?: boolean; role?: string }) =>
    handleApiResponse(() => api.put(`/admin/users/${userId}`, data)),
};

// Reports Management API
export const reportApi = {
  getReports: (params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    priority?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    return handleApiResponse(() => 
      api.get(`/admin/reports${queryString ? `?${queryString}` : ''}`)
    );
  },
  
  getReportById: (reportId: string) => 
    handleApiResponse(() => api.get(`/admin/reports/${reportId}`)),
  
  updateReportStatus: (reportId: string, data: { status: string; reviewNotes?: string }) =>
    handleApiResponse(() => api.put(`/admin/reports/${reportId}`, data)),
};

// Content Flags Management API
export const contentFlagApi = {
  getContentFlags: (params: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    severity?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    return handleApiResponse(() => 
      api.get(`/admin/content-flags${queryString ? `?${queryString}` : ''}`)
    );
  },
  
  getContentFlagById: (flagId: string) => 
    handleApiResponse(() => api.get(`/admin/content-flags/${flagId}`)),
  
  updateContentFlag: (flagId: string, data: { status: string; action?: string; actionNotes?: string }) =>
    handleApiResponse(() => api.put(`/admin/content-flags/${flagId}`, data)),
};

// Counselor Verification API
export const counselorApi = {
  getPendingCounselors: (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    return handleApiResponse(() => 
      api.get(`/admin/counselors/pending${queryString ? `?${queryString}` : ''}`)
    );
  },
  
  getCounselorById: (counselorId: string) => 
    handleApiResponse(() => api.get(`/admin/counselors/${counselorId}`)),
  
  approveCounselor: (counselorId: string, data: { approvalNotes?: string }) =>
    handleApiResponse(() => api.put(`/admin/counselors/${counselorId}/approve`, data)),
  
  rejectCounselor: (counselorId: string, data: { rejectionReason: string; rejectionNotes?: string }) =>
    handleApiResponse(() => api.put(`/admin/counselors/${counselorId}/reject`, data)),
  
  requestMoreInfo: (counselorId: string, data: { requestedInfo: string; notes?: string }) =>
    handleApiResponse(() => api.put(`/admin/counselors/${counselorId}/request-info`, data)),
};

export default api;