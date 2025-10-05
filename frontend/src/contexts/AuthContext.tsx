/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { mapBackendRoleToFrontend, extractErrorMessage } from "./authUtils";

interface User {
  id: string;
  name: string;
  email: string;
  role: "chairman" | "admin" | "staff" | "client";
  companyId?: string;
  branchId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          const response = await authAPI.getMe();
          const mappedUser = {
            ...response.user,
            role: mapBackendRoleToFrontend(response.user.role),
          } as User;
          setUser(mappedUser);
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);

      localStorage.setItem("token", response.token);
      const mappedUser = {
        ...response.user,
        role: mapBackendRoleToFrontend(response.user.role),
      };
      localStorage.setItem("user", JSON.stringify(mappedUser));

      setUser(mappedUser);
    } catch (error: unknown) {
      console.error("❌ AuthContext: Login failed:", error);
      const message = extractErrorMessage(error) || "Login failed";
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;

    const rolePermissions = {
      chairman: ["all"],
      admin: ["company_manage", "branch_manage", "staff_manage", "reports"],
      staff: ["own_tasks", "attendance"],
      client: ["own_bookings", "payments"],
    };

    const userPermissions = rolePermissions[user.role] || [];
    return (
      userPermissions.includes("all") || userPermissions.includes(permission)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
