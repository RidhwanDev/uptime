import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { upsertUser } from "../services/supabaseSync";
import { refreshAccessToken } from "../services/tiktokAuth";

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
  getValidAccessToken: () => Promise<string | null>; // Get access token, refreshing if needed
  bypassLogin: () => Promise<void>; // DEV ONLY - bypass authentication
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "tiktok_access_token";
const REFRESH_TOKEN_KEY = "tiktok_refresh_token";
const USER_INFO_KEY = "tiktok_user_info";
const SUPABASE_USER_ID_KEY = "supabase_user_id";
const TOKEN_EXPIRES_AT_KEY = "tiktok_token_expires_at";

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
      // Calculate expiration time
      const expiresAt = Date.now() + tokens.expiresIn * 1000;

      // Store tokens securely (local)
      await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
      await SecureStore.setItemAsync(TOKEN_EXPIRES_AT_KEY, expiresAt.toString());
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

  const getValidAccessToken = async (): Promise<string | null> => {
    try {
      const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const expiresAtStr = await SecureStore.getItemAsync(TOKEN_EXPIRES_AT_KEY);

      if (!accessToken || !refreshToken) {
        console.log("⚠️ No tokens found");
        return null;
      }

      // Check if token is expired (with 5 minute buffer)
      const now = Date.now();
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
      const bufferTime = 5 * 60 * 1000; // 5 minutes

      if (expiresAt > 0 && now >= expiresAt - bufferTime) {
        console.log("🔄 Token expired or expiring soon, refreshing...");
        const refreshResult = await refreshAccessToken(refreshToken);

        if (refreshResult.success && refreshResult.tokens) {
          // Store new tokens
          const newExpiresAt = now + refreshResult.tokens.expiresIn * 1000;
          await SecureStore.setItemAsync(TOKEN_KEY, refreshResult.tokens.accessToken);
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshResult.tokens.refreshToken);
          await SecureStore.setItemAsync(TOKEN_EXPIRES_AT_KEY, newExpiresAt.toString());

          // Update user state with new token
          setUser((prev) => {
            if (prev) {
              return { ...prev, accessToken: refreshResult.tokens!.accessToken };
            }
            return prev;
          });

          // Update Supabase
          const userInfoStr = await SecureStore.getItemAsync(USER_INFO_KEY);
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            await upsertUser({
              tiktokUserId: userInfo.tiktokUserId,
              tiktokHandle: userInfo.tiktokHandle,
              displayName: userInfo.displayName,
              avatarUrl: userInfo.avatarUrl,
              accessToken: refreshResult.tokens.accessToken,
              refreshToken: refreshResult.tokens.refreshToken,
              expiresIn: refreshResult.tokens.expiresIn,
            });
          }

          console.log("✅ Token refreshed successfully");
          return refreshResult.tokens.accessToken;
        } else {
          console.error("❌ Failed to refresh token:", refreshResult.error);
          // If refresh fails, user needs to re-login
          await logout();
          return null;
        }
      }

      return accessToken;
    } catch (error) {
      console.error("❌ Error getting valid access token:", error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRES_AT_KEY);
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
        getValidAccessToken,
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
