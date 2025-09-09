/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = "https://whisprr-api.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

const handleApiResponse = async <T>(apiCall: () => Promise<AxiosResponse<T>>) => {
  try {
    const { data } = await apiCall();
    return { success: true, data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'An error occurred' 
      };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
};

const createQueryString = (params: Record<string, any>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.append(key, value.toString());
  });
  return searchParams.toString();
};

export const dashboardApi = {
  getAnalytics: () => handleApiResponse(() => api.get('/admin/dashboard')),
  getSystemHealth: () => handleApiResponse(() => api.get('/admin/system-health')),
};

export const crisisApi = {
  getCrisisAlerts: () => handleApiResponse(() => api.get('/admin/crisis-alerts')),
  updateCrisisAlert: (messageId: string, data: any) =>
    handleApiResponse(() => api.put(`/admin/crisis-alerts/${messageId}`, data)),
};

export const userApi = {
  getUsers: (params = {}) => handleApiResponse(() => api.get(`/admin/users?${createQueryString(params)}`)),
  getUserById: (userId: string) => handleApiResponse(() => api.get(`/admin/users/${userId}`)),
  banUser: (userId: string) => handleApiResponse(() => api.post(`/admin/users/${userId}/ban`)),
  unbanUser: (userId: string) => handleApiResponse(() => api.post(`/admin/users/${userId}/unban`)),
};

export const reportApi = {
  getReports: (params = {}) => handleApiResponse(() => api.get(`/reports?${createQueryString(params)}`)),
  getReportById: (reportId: string) => handleApiResponse(() => api.get(`/reports/${reportId}`)),
  reviewReport: (reportId: string, data: { status: string; reviewNotes?: string }) =>
    handleApiResponse(() => api.post(`/reports/${reportId}/review`, data)),
};

export const contentFlagApi = {
  getContentFlags: (params = {}) => handleApiResponse(() => api.get(`/moderation/flagged?${createQueryString(params)}`)),
  getContentFlagById: (flagId: string) => handleApiResponse(() => api.get(`/moderation/flagged/${flagId}`)),
  updateContentFlag: (flagId: string, data: { status: string; action?: string; actionNotes?: string }) =>
    handleApiResponse(() => api.put(`/moderation/flagged/${flagId}`, data)),
  moderateMessage: (messageId: string, data: { action: string; reason?: string }) =>
    handleApiResponse(() => api.post(`/moderation/messages/${messageId}`, data)),
};

export const counselorApi = {
  getPendingCounselors: (params = {}) =>
    handleApiResponse(() => api.get(`/counselors/pending-verifications?${createQueryString(params)}`)),
  getCounselorById: (counselorId: string) => handleApiResponse(() => api.get(`/counselors/${counselorId}`)),
  approveCounselor: (counselorId: string, data: { approvalNotes?: string }) =>
    handleApiResponse(() => api.post(`/counselors/${counselorId}/approve`, data)),
  rejectCounselor: (counselorId: string, data: { rejectionReason: string; rejectionNotes?: string }) =>
    handleApiResponse(() => api.post(`/counselors/${counselorId}/reject`, data)),
  getApplicationStats: () => handleApiResponse(() => api.get('/counselors/stats')),
};

export default api;