import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { upsertUser } from "../services/supabaseSync";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id?: string; // Supabase user ID
    tiktokUserId?: string;
    tiktokHandle?: string; // @username
    displayName?: string;  // Display name
    avatarUrl?: string;
    accessToken?: string;
  } | null;
  login: (
    tokens: { accessToken: string; refreshToken: string; expiresIn: number },
    userInfo: { tiktokUserId: string; tiktokHandle: string; displayName: string; avatarUrl?: string }
  ) => Promise<void>;
  logout: () => Promise<void>;
  bypassLogin: () => Promise<void>; // DEV ONLY - bypass authentication
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "tiktok_access_token";
const REFRESH_TOKEN_KEY = "tiktok_refresh_token";
const USER_INFO_KEY = "tiktok_user_info";
const SUPABASE_USER_ID_KEY = "supabase_user_id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthContextType["user"]>(null);

  useEffect(() => {
    // Check if user is already authenticated on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const userInfoStr = await SecureStore.getItemAsync(USER_INFO_KEY);
      const supabaseUserId = await SecureStore.getItemAsync(SUPABASE_USER_ID_KEY);

      if (accessToken && userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        setIsAuthenticated(true);
        setUser({
          id: supabaseUserId || undefined,
          tiktokUserId: userInfo.tiktokUserId,
          tiktokHandle: userInfo.tiktokHandle,
          displayName: userInfo.displayName,
          avatarUrl: userInfo.avatarUrl,
          accessToken,
        });
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    tokens: { accessToken: string; refreshToken: string; expiresIn: number },
    userInfo: { tiktokUserId: string; tiktokHandle: string; displayName: string; avatarUrl?: string }
  ) => {
    try {
      // Store tokens securely (local)
      await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
      await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(userInfo));

      // Upsert user to Supabase
      const supabaseUser = await upsertUser({
        tiktokUserId: userInfo.tiktokUserId,
        tiktokHandle: userInfo.tiktokHandle,
        displayName: userInfo.displayName,
        avatarUrl: userInfo.avatarUrl,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });

      // Store Supabase user ID for reference
      if (supabaseUser?.id) {
        await SecureStore.setItemAsync(SUPABASE_USER_ID_KEY, supabaseUser.id);
      }

      setIsAuthenticated(true);
      setUser({
        id: supabaseUser?.id,
        tiktokUserId: userInfo.tiktokUserId,
        tiktokHandle: userInfo.tiktokHandle,
        displayName: userInfo.displayName,
        avatarUrl: userInfo.avatarUrl,
        accessToken: tokens.accessToken,
      });

      console.log("✅ Login complete, user saved to Supabase:", supabaseUser?.id);
    } catch (error) {
      console.error("Error storing auth data:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_INFO_KEY);
      await SecureStore.deleteItemAsync(SUPABASE_USER_ID_KEY);

      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  // DEV ONLY - Bypass authentication for development/testing
  const bypassLogin = async () => {
    console.warn("⚠️ DEV MODE: Bypassing authentication");
    setIsAuthenticated(true);
    setUser({
      tiktokUserId: "dev_user_123",
      tiktokHandle: "dev_user",
      accessToken: "dev_token_bypass",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        bypassLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
