import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiClient, setAccessToken } from "../api/client";

type AccountType = "vendeur" | "client";
type User = { id: string; email: string; accountType: AccountType };
type AuthResponse = { user: User; accessToken: string };

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, accountType: AccountType) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const { accessToken: token } = await apiClient.post<{ accessToken: string }>("/api/auth/refresh", {});
        setAccessToken(token);
        setAccessTokenState(token);
        const { user: restoredUser } = await apiClient.get<{ user: User }>("/api/auth/me");
        setUser(restoredUser);
      } catch {
        setAccessToken(null);
        setAccessTokenState(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<AuthResponse>("/api/auth/login", { email, password });
    setAccessToken(res.accessToken);
    setAccessTokenState(res.accessToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, accountType: AccountType) => {
    const res = await apiClient.post<AuthResponse>("/api/auth/register", { email, password, accountType });
    setAccessToken(res.accessToken);
    setAccessTokenState(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    apiClient.post("/api/auth/logout", {}).catch(() => {});
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
