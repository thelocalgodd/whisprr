/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Login as LoginService,
  Register as RegisterService,
  Logout as LogoutService,
  type User as BackendUser,
} from "@/services/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextType {
  user: BackendUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    fullName: string,
    role?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing backend session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await LoginService(username, password);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);

        toast.success("Login successful");
        router.push("/dashboard");
      } else {
        throw new Error(response.message);
        toast.error(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const register = async (
    username: string,
    password: string,
    fullName: string,
    role: string = "user"
  ) => {
    try {
      const response = await RegisterService(
        username,
        password,
        fullName,
        role
      );
      if (response.success) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);

        toast.success("Registration successful");
        router.push("/dashboard");
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed");
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Logout from backend if logged in
      if (user) {
        await LogoutService();
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }

      toast.success("Logged out successfully");
      router.push("/");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message || "Logout failed");
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
