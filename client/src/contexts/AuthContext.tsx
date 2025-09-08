"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Login as LoginService, Register as RegisterService, Logout as LogoutService, type User as BackendUser } from "@/services/auth";
import { 
  signInAnonymouslyFirebase, 
  signOutFirebase, 
  onFirebaseAuthStateChanged, 
  getCurrentFirebaseUser,
  type FirebaseAuthUser 
} from "@/services/firebase-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextType {
  user: BackendUser | null;
  firebaseUser: FirebaseAuthUser | null;
  isLoading: boolean;
  isAnonymous: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing backend session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Set up Firebase auth listener
    const unsubscribe = onFirebaseAuthStateChanged((fbUser) => {
      setFirebaseUser(fbUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await LoginService(username, password);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
        
        // Sign out of Firebase anonymous auth if logged in
        if (firebaseUser?.isAnonymous) {
          await signOutFirebase();
        }
        
        toast.success("Login successful");
        router.push("/dashboard");
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const register = async (username: string, password: string, role: string) => {
    try {
      const response = await RegisterService(username, password, role);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // Sign out of Firebase anonymous auth if logged in
        if (firebaseUser?.isAnonymous) {
          await signOutFirebase();
        }
        
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

  const loginAnonymously = async () => {
    try {
      const fbUser = await signInAnonymouslyFirebase();
      setFirebaseUser(fbUser);
      toast.success("Signed in anonymously");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Anonymous login error:", error);
      toast.error(error.message || "Anonymous login failed");
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
      
      // Sign out from Firebase
      if (firebaseUser) {
        await signOutFirebase();
        setFirebaseUser(null);
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
    firebaseUser,
    isLoading,
    isAnonymous: !user && firebaseUser?.isAnonymous === true,
    login,
    register,
    loginAnonymously,
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