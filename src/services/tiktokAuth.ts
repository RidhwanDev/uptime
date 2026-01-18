import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Complete the web browser session when done
WebBrowser.maybeCompleteAuthSession();

// TikTok OAuth Configuration
const TIKTOK_CLIENT_KEY = process.env.EXPO_PUBLIC_TIKTOK_CLIENT_KEY || "";
const TIKTOK_CLIENT_SECRET = process.env.EXPO_PUBLIC_TIKTOK_CLIENT_SECRET || "";

// TikTok API Endpoints
const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
// user.info.basic: open_id, union_id, avatar_url, display_name
// user.info.profile: username, bio_description, profile_deep_link, is_verified
const TIKTOK_USER_INFO_URL =
  "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,is_verified";

// Get platform-specific redirect URI
// TikTok requires HTTPS URLs for iOS/Android redirect URIs (Universal Links/App Links)
const getRedirectUri = (): string => {
  // Priority 1: Environment variable for HTTPS redirect URI (can override default)
  const envUri = process.env.EXPO_PUBLIC_TIKTOK_REDIRECT_URI;
  if (envUri) {
    return envUri;
  }

  // Priority 2: Default to portfolio callback endpoint
  // This endpoint redirects to the app's custom scheme: socialuptime://auth/callback
  return "https://ridhwan.io/uptime/tiktok/callback";

  // Priority 3: For web, try web-specific redirect URI (if different)
  // if (Platform.OS === "web") {
  //   const webUri = process.env.EXPO_PUBLIC_WEB_REDIRECT_URI;
  //   if (webUri) {
  //     return webUri;
  //   }
  // }
};

// Store PKCE values for auth flow
let storedCodeVerifier: string | null = null;
let storedState: string | null = null;

// Log configuration for debugging
const REDIRECT_URI = getRedirectUri();
console.log("🔗 TikTok Redirect URI:", REDIRECT_URI);
console.log(
  "⚠️  Copy this EXACT URI to TikTok developer settings (Redirect URI)"
);
console.log(
  "🔑 TikTok Client Key:",
  TIKTOK_CLIENT_KEY
    ? `${TIKTOK_CLIENT_KEY.substring(0, 8)}... (${
        TIKTOK_CLIENT_KEY.length
      } chars)`
    : "❌ NOT LOADED"
);

interface TikTokUserInfo {
  tiktokUserId: string;
  tiktokHandle: string; // @username
  displayName: string; // Display name
  avatarUrl?: string;
}

interface AuthResult {
  success: boolean;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  userInfo?: TikTokUserInfo;
  error?: string;
}

// Generate PKCE code verifier and challenge
async function generatePKCE(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  // Generate a random 32-byte code verifier
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const base64 = btoa(String.fromCharCode(...randomBytes));
  const codeVerifier = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Generate code challenge (SHA256 hash of verifier, base64url encoded)
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  const codeChallenge = hash
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return { codeVerifier, codeChallenge };
}

export async function authenticateWithTikTok(): Promise<AuthResult> {
  try {
    if (!TIKTOK_CLIENT_KEY) {
      throw new Error(
        "TikTok Client Key is not configured. Please set EXPO_PUBLIC_TIKTOK_CLIENT_KEY in your .env file."
      );
    }

    const redirectUri = getRedirectUri();
    console.log("🚀 Starting TikTok OAuth flow...");
    console.log("📍 Platform:", Platform.OS);
    console.log("📍 Redirect URI:", redirectUri);

    // Step 1: Generate PKCE
    const { codeVerifier, codeChallenge } = await generatePKCE();
    console.log("✅ Generated PKCE code verifier and challenge");

    // Step 2: Generate state for CSRF protection
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Store for auth completion
    storedCodeVerifier = codeVerifier;
    storedState = state;

    // Step 3: Build authorization URL
    // TikTok uses client_key instead of client_id
    // Request all the scopes we need
    // user.info.basic: open_id, union_id, avatar_url, display_name
    // user.info.profile: username, is_verified
    // video.list: access to user's videos with view_count, like_count
    const scopes = "user.info.basic,user.info.profile,video.list";
    const authUrl = new URL(TIKTOK_AUTH_URL);
    authUrl.searchParams.append("client_key", TIKTOK_CLIENT_KEY);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", scopes);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");

    console.log("🔗 Authorization URL:", authUrl.toString());

    // Step 4: Open browser/app for authentication
    console.log("🌐 Opening TikTok authorization...");
    console.log("🔗 Expecting redirect to:", redirectUri);

    let redirectUrl: string | null = null;

    // Set up a listener for deep links
    // Handle both HTTPS Universal Links and custom scheme URLs
    // The portfolio callback redirects to: socialuptime://auth/callback?code=...&state=...
    const linkPromise = new Promise<string>((resolve) => {
      Linking.addEventListener("url", (event) => {
        console.log("🔗 Deep link received:", event.url);
        // Check if URL contains auth code
        if (event.url.includes("code=")) {
          // For HTTPS Universal Links, check if it matches the redirect URI domain/path
          if (
            redirectUri.startsWith("https://") &&
            event.url.startsWith(redirectUri)
          ) {
            resolve(event.url);
          }
          // For custom scheme (portfolio redirects to this)
          else if (event.url.startsWith("socialuptime://auth/callback")) {
            resolve(event.url);
          }
          // Fallback: accept any URL with auth/callback and code
          else if (
            event.url.includes("auth/callback") &&
            event.url.includes("code=")
          ) {
            resolve(event.url);
          }
        }
      });
    });

    try {
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        redirectUri,
        {
          dismissButtonStyle: "close",
        }
      );

      console.log("📥 Browser result type:", result.type);

      if (result.type === "success" && "url" in result) {
        redirectUrl = result.url;
        console.log("📥 Redirect URL from browser:", redirectUrl);
      } else if (result.type === "dismiss" && !redirectUrl) {
        // Browser was dismissed - check if we got a link via the listener
        console.log("📥 Browser dismissed, checking for deep link...");

        // Wait a moment to see if we get a deep link
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 2000)
        );

        const possibleUrl = await Promise.race([linkPromise, timeoutPromise]);
        if (possibleUrl) {
          redirectUrl = possibleUrl;
          console.log("📥 Got URL from deep link:", redirectUrl);
        }
      }
    } catch (error) {
      console.error("Error in auth session:", error);
    }

    // If we still don't have a redirect URL, check the initial URL
    // (in case the app was reopened with the redirect)
    if (!redirectUrl) {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.includes("code=")) {
        // Check if it matches our redirect URI pattern
        if (
          (redirectUri.startsWith("https://") &&
            initialUrl.startsWith(redirectUri)) ||
          initialUrl.startsWith("socialuptime://auth/callback") ||
          initialUrl.includes("auth/callback")
        ) {
          redirectUrl = initialUrl;
          console.log("📥 Got URL from initial URL:", redirectUrl);
        }
      }
    }

    if (!redirectUrl) {
      return {
        success: false,
        error: "Authentication was cancelled or failed. Please try again.",
      };
    }

    console.log("📥 Final redirect URL:", redirectUrl);

    // Step 5: Parse the redirect URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redirectUrl);
    } catch {
      // If URL parsing fails, try to extract code manually
      const codeMatch = redirectUrl.match(/[?&]code=([^&]+)/);
      const stateMatch = redirectUrl.match(/[?&]state=([^&]+)/);
      const errorMatch = redirectUrl.match(/[?&]error=([^&]+)/);

      if (errorMatch) {
        return {
          success: false,
          error: decodeURIComponent(errorMatch[1]) || "Authorization failed",
        };
      }

      if (!codeMatch) {
        return { success: false, error: "No authorization code received" };
      }

      const code = decodeURIComponent(codeMatch[1]);
      const returnedState = stateMatch
        ? decodeURIComponent(stateMatch[1])
        : null;

      // Verify state matches (CSRF protection)
      if (returnedState && returnedState !== state) {
        console.warn("⚠️ State mismatch:", {
          expected: state,
          received: returnedState,
        });
        return {
          success: false,
          error: "State mismatch - possible CSRF attack",
        };
      }

      // Exchange code for token
      return await exchangeCodeForToken(code, codeVerifier, redirectUri);
    }

    const code = parsedUrl.searchParams.get("code");
    const returnedState = parsedUrl.searchParams.get("state");
    const error = parsedUrl.searchParams.get("error");
    const errorDescription = parsedUrl.searchParams.get("error_description");

    if (error) {
      return {
        success: false,
        error: errorDescription || error || "Authorization failed",
      };
    }

    if (!code) {
      return { success: false, error: "No authorization code received" };
    }

    // Verify state matches (CSRF protection)
    if (returnedState !== state) {
      console.warn("⚠️ State mismatch:", {
        expected: state,
        received: returnedState,
      });
      return { success: false, error: "State mismatch - possible CSRF attack" };
    }

    console.log("✅ Authorization code received");

    // Step 6: Exchange code for access token
    return await exchangeCodeForToken(code, codeVerifier, redirectUri);
  } catch (error) {
    console.error("❌ TikTok authentication error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  } finally {
    // Clear stored values
    storedCodeVerifier = null;
    storedState = null;
  }
}

async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<AuthResult> {
  console.log("🔄 Exchanging code for access token...");

  const tokenResponse = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  const tokenData = await tokenResponse.json();
  console.log("📥 Token response status:", tokenResponse.status);

  if (!tokenResponse.ok || tokenData.error) {
    console.error("❌ Token exchange error:", tokenData);
    return {
      success: false,
      error:
        tokenData.error_description ||
        tokenData.error ||
        "Failed to exchange code for token",
    };
  }

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token || "";
  const expiresIn = tokenData.expires_in || 3600;

  if (!accessToken) {
    return { success: false, error: "No access token received" };
  }

  console.log("✅ Access token received");

  // Step 7: Fetch user info
  console.log("👤 Fetching user info...");

  const userInfoResponse = await fetch(TIKTOK_USER_INFO_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const userInfoData = await userInfoResponse.json();
  console.log("📥 User info response status:", userInfoResponse.status);

  // TikTok returns error object even on success with code: "ok"
  const hasError =
    !userInfoResponse.ok ||
    (userInfoData.error &&
      userInfoData.error.code &&
      userInfoData.error.code !== "ok");

  if (hasError) {
    console.error("❌ User info error:", userInfoData);
    // Still return success with tokens, just without user info
    return {
      success: true,
      tokens: { accessToken, refreshToken, expiresIn },
      userInfo: {
        tiktokUserId: "unknown",
        tiktokHandle: "unknown",
        displayName: "TikTok User",
      },
    };
  }

  const user = userInfoData.data?.user;
  console.log(
    "✅ User info received:",
    user?.display_name,
    "@" + user?.username
  );

  return {
    success: true,
    tokens: { accessToken, refreshToken, expiresIn },
    userInfo: {
      tiktokUserId: user?.open_id || user?.union_id || "unknown",
      tiktokHandle: user?.username || user?.display_name || "unknown",
      displayName: user?.display_name || "TikTok User",
      avatarUrl: user?.avatar_url,
    },
  };
}

// Export redirect URI for easy access (to copy to TikTok settings)
export const getTikTokRedirectUri = () => getRedirectUri();

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<AuthResult> {
  try {
    console.log("🔄 Refreshing access token...");

    const tokenResponse = await fetch(TIKTOK_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();
    console.log("📥 Refresh token response status:", tokenResponse.status);

    if (!tokenResponse.ok || tokenData.error) {
      console.error("❌ Token refresh error:", tokenData);
      return {
        success: false,
        error:
          tokenData.error_description ||
          tokenData.error ||
          "Failed to refresh token",
      };
    }

    const accessToken = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token || refreshToken; // Use new refresh token if provided, otherwise keep old one
    const expiresIn = tokenData.expires_in || 3600;

    if (!accessToken) {
      return { success: false, error: "No access token received" };
    }

    console.log("✅ Access token refreshed");

    return {
      success: true,
      tokens: { accessToken, refreshToken: newRefreshToken, expiresIn },
    };
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
