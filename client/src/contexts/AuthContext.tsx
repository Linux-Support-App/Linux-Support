import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SafeUser } from "@shared/schema";

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  canModerate: boolean;
  canManageUsers: boolean;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return apiRequest<SafeUser>("POST", "/api/auth/login", { username, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ username, password, displayName }: { username: string; password: string; displayName?: string }) => {
      return apiRequest<SafeUser>("POST", "/api/auth/register", { username, password, displayName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (username: string, password: string, displayName?: string) => {
    await registerMutation.mutateAsync({ username, password, displayName });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const canModerate = user?.role === "owner" || user?.role === "admin" || user?.role === "moderator";
  const canManageUsers = user?.role === "owner" || user?.role === "admin";
  const isOwner = user?.role === "owner";

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      isLoading,
      login,
      register,
      logout,
      canModerate,
      canManageUsers,
      isOwner,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
