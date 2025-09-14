import { authApi, type User, type ApiResponse } from '@/lib/api';

// Re-export types for backward compatibility
export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

// Auth service functions that wrap the API calls
export const Login = async (
  usernameOrEmail: string, 
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await authApi.login({
      ...(usernameOrEmail.includes('@') 
        ? { email: usernameOrEmail } 
        : { username: usernameOrEmail }
      ),
      password,
    });

    if (response.success && response.data) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return {
        success: true,
        message: response.message || 'Login successful',
        user: response.data.user,
        token: response.data.token,
      };
    } else {
      return {
        success: false,
        message: response.error || 'Login failed',
        user: {} as User,
        token: '',
      };
    }
  } catch (error: unknown) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during login.';
    return {
      success: false,
      message: errorMessage,
      user: {} as User,
      token: '',
    };
  }
};

export const Register = async (
  username: string,
  email: string,
  password: string,
  fullName: string,
  role: string = 'user'
): Promise<RegisterResponse> => {
  try {
    const response = await authApi.register({
      username,
      email,
      password,
      fullName,
      role,
    });

    if (response.success && response.data) {
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return {
        success: true,
        message: response.message || 'Registration successful',
        user: response.data.user,
        token: response.data.token || '',
      };
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during registration.';
    throw new Error(errorMessage);
  }
};

export const Logout = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await authApi.logout();
    
    // Clear local storage regardless of API response
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return {
      success: true,
      message: response.message || 'Logout successful',
    };
  } catch (error: unknown) {
    console.error('Logout error:', error);
    
    // Still clear local storage even if API call fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return {
      success: true,
      message: 'Logout completed',
    };
  }
};

export const GetProfile = async (): Promise<User | null> => {
  try {
    const response = await authApi.getProfile();
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
    
    return null;
  } catch (error: unknown) {
    console.error('Get profile error:', error);
    return null;
  }
};

export const UpdateProfile = async (profileData: Partial<User>): Promise<User | null> => {
  try {
    const response = await authApi.updateProfile(profileData);
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
    
    return null;
  } catch (error: unknown) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

export const ChangePassword = async (
  currentPassword: string, 
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await authApi.changePassword({
      currentPassword,
      newPassword,
    });
    
    return {
      success: response.success,
      message: response.message || 'Password changed successfully',
    };
  } catch (error: unknown) {
    console.error('Change password error:', error);
    throw new Error(error.message || 'Failed to change password');
  }
};

export const VerifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await authApi.verifyEmail(token);
    
    return {
      success: response.success,
      message: response.message || 'Email verified successfully',
    };
  } catch (error: unknown) {
    console.error('Email verification error:', error);
    throw new Error(error.message || 'Failed to verify email');
  }
};

export const RequestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await authApi.requestPasswordReset(email);
    
    return {
      success: response.success,
      message: response.message || 'Password reset email sent',
    };
  } catch (error: unknown) {
    console.error('Password reset request error:', error);
    throw new Error(error.message || 'Failed to request password reset');
  }
};

export const ResetPassword = async (
  token: string, 
  password: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await authApi.resetPassword({ token, password });
    
    return {
      success: response.success,
      message: response.message || 'Password reset successfully',
    };
  } catch (error: unknown) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
};

// Utility functions
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  return !!token;
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Export types
export type { User };
export { authApi };