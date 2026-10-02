"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthResponse } from "@/types/api";
import { loginUser, registerUser, getMe } from "@/lib/api";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("bank_twin_token");
    if (savedToken) {
      getMe()
        .then((u) => {
          setToken(savedToken);
          setUser(u);
        })
        .catch(() => {
          localStorage.removeItem("bank_twin_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      queueMicrotask(() => setLoading(false));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res: AuthResponse = await loginUser({ email, password });
    localStorage.setItem("bank_twin_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    toast.success(`Welcome back, ${res.user.full_name}!`);
  };

  const register = async (email: string, password: string, fullName: string) => {
    await registerUser({ email, password, full_name: fullName });
    toast.success("Account registered successfully! Please sign in with your credentials.");
  };

  const logout = () => {
    localStorage.removeItem("bank_twin_token");
    setToken(null);
    setUser(null);
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
