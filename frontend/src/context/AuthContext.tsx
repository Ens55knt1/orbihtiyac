import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export type UserRole = "admin" | "yonetici" | "genel" | "floor3" | "floor6";

interface User {
  id: number;
  isim: string;
  soyisim: string;
  kullaniciAdi?: string;
  role: UserRole;
  roles?: UserRole[];
  requiresPasswordChange?: boolean;
  profilePhoto?: string | null;
  nameColor?: string | null;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  login: (isim: string, soyisim: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (isim: string, soyisim: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setUser: (u: User | null) => void;
  getAuthHeaders: () => Record<string, string>;
  slipUrl: (fileName: string) => string;
  profilePhotoUrl: (fileName: string) => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "orbisis_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUserState] = useState<User | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const t = token ?? localStorage.getItem(TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const slipUrl = (fileName: string) => {
    const t = token ?? localStorage.getItem(TOKEN_KEY);
    const base = API_BASE || "";
    return t ? `${base}/api/slips/${fileName}?token=${encodeURIComponent(t)}` : `${base}/api/slips/${fileName}`;
  };

  const profilePhotoUrl = (fileName: string) => {
    const t = token ?? localStorage.getItem(TOKEN_KEY);
    const base = API_BASE || "";
    return t ? `${base}/api/profile/photo/${fileName}?token=${encodeURIComponent(t)}` : "";
  };

  useEffect(() => {
    const t = token ?? localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setUserState(null);
      return;
    }
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => {
        if (res.ok) return res.json();
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        setUserState(null);
      })
      .then((data) => {
        if (data?.user) setUserState(data.user);
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        setUserState(null);
      });
  }, [token]);

  const login = async (isim: string, soyisim: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isim: isim.trim(), soyisim: (soyisim ?? "").trim(), password })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || "Giriş başarısız" };
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUserState(data.user);
      return { success: true };
    } catch {
      return { success: false, message: "Bağlantı hatası" };
    }
  };

  const register = async (isim: string, soyisim: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isim: isim.trim(), soyisim: (soyisim ?? "").trim(), password })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message || "Kayıt başarısız" };
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUserState(data.user);
      return { success: true };
    } catch {
      return { success: false, message: "Bağlantı hatası" };
    }
  };

  const logout = () => {
    setToken(null);
    setUserState(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const setUser = (u: User | null) => setUserState(u);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, setUser, getAuthHeaders, slipUrl, profilePhotoUrl }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
