import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";

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

// Generate redirect URI
// For development builds: uses custom scheme (uptime://)
// For Expo Go: requires HTTPS proxy (auth.expo.io) or env variable override
const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: "uptime",
  path: "auth/callback",
});

// Get the final redirect URI to use
const getRedirectUri = (): string => {
  // Priority 1: Environment variable (for HTTPS override in Expo Go)
  const envUri = process.env.EXPO_PUBLIC_REDIRECT_URI;
  if (envUri) {
    return envUri;
  }

  // Priority 2: Auto-generated URI (works in development builds)
  // In development builds, this will be: uptime://auth/callback
  // In Expo Go, this will be: exp://192.168.x.x:8081/--/auth/callback
  return REDIRECT_URI;
};

const FINAL_REDIRECT_URI = getRedirectUri();

// Store PKCE values for manual URL completion
let storedCodeVerifier: string | null = null;
let storedState: string | null = null;

// Log configuration for debugging
console.log("🔗 TikTok Redirect URI:", FINAL_REDIRECT_URI);
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

    console.log("🚀 Starting TikTok OAuth flow...");
    console.log("📍 Redirect URI:", FINAL_REDIRECT_URI);

    // Step 1: Generate PKCE
    const { codeVerifier, codeChallenge } = await generatePKCE();
    console.log("✅ Generated PKCE code verifier and challenge");

    // Step 2: Generate state for CSRF protection
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Store for manual URL completion fallback
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
    authUrl.searchParams.append("redirect_uri", FINAL_REDIRECT_URI);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");

    console.log("🔗 Authorization URL:", authUrl.toString());

    // Step 4: Open browser for authentication
    // Try openAuthSessionAsync first, fall back to manual handling if needed
    console.log("🌐 Opening TikTok authorization page...");
    console.log("🔗 Expecting redirect to:", FINAL_REDIRECT_URI);

    let redirectUrl: string | null = null;

    // Set up a listener for deep links (backup in case openAuthSessionAsync doesn't work)
    let linkingSubscription: { remove: () => void } | null = null;
    const linkPromise = new Promise<string>((resolve) => {
      linkingSubscription = Linking.addEventListener("url", (event) => {
        console.log("🔗 Deep link received:", event.url);
        if (event.url.includes("code=")) {
          resolve(event.url);
        }
      });
    });

    try {
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        FINAL_REDIRECT_URI,
        {
          // Try to dismiss the browser on iOS even if there's no matching redirect
          dismissButtonStyle: "close",
        }
      );

      console.log("📥 Browser result type:", result.type);

      if (result.type === "success" && "url" in result) {
        redirectUrl = result.url;
        console.log("📥 Redirect URL from browser:", redirectUrl);
      } else if (result.type === "cancel" || result.type === "dismiss") {
        // Browser was closed - this is expected when auth.expo.io shows "Forbidden"
        // User needs to paste the URL manually
        console.log(
          "📥 Browser closed (type:",
          result.type,
          ") - showing URL paste fallback"
        );
      }

      if (result.type === "dismiss" && !redirectUrl) {
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
    } finally {
      linkingSubscription?.remove();
    }

    // If we still don't have a redirect URL, check the initial URL
    // (in case the app was reopened with the redirect)
    if (!redirectUrl) {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.includes("code=")) {
        redirectUrl = initialUrl;
        console.log("📥 Got URL from initial URL:", redirectUrl);
      }
    }

    if (!redirectUrl) {
      // Return a specific error that tells the UI to show the URL paste fallback
      return {
        success: false,
        error: "SHOW_URL_INPUT",
      };
    }

    console.log("📥 Final redirect URL:", redirectUrl);

    // Step 5: Parse the redirect URL
    const parsedUrl = new URL(redirectUrl);
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
        redirect_uri: FINAL_REDIRECT_URI,
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

    if (!userInfoResponse.ok || userInfoData.error) {
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
  } catch (error) {
    console.error("❌ TikTok authentication error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Export redirect URI for easy access (to copy to TikTok settings)
export const getTikTokRedirectUri = () => FINAL_REDIRECT_URI;

/**
 * Complete authentication using a manually pasted URL
 * This is a fallback for when the browser doesn't redirect properly (e.g., Expo Go with auth.expo.io proxy)
 */
export async function completeAuthWithUrl(
  pastedUrl: string
): Promise<AuthResult> {
  try {
    console.log("🔗 Completing auth with pasted URL...");
    console.log("📥 URL:", pastedUrl);

    // Parse the URL to extract code and state
    let code: string | null = null;
    let returnedState: string | null = null;

    try {
      const parsedUrl = new URL(pastedUrl);
      code = parsedUrl.searchParams.get("code");
      returnedState = parsedUrl.searchParams.get("state");
    } catch {
      // URL parsing failed, try regex extraction
      const codeMatch = pastedUrl.match(/[?&]code=([^&]+)/);
      const stateMatch = pastedUrl.match(/[?&]state=([^&]+)/);

      code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;
      returnedState = stateMatch ? decodeURIComponent(stateMatch[1]) : null;
    }

    if (!code) {
      return { success: false, error: "No authorization code found in URL" };
    }

    console.log("✅ Authorization code extracted");

    // Check if we have stored PKCE values
    if (!storedCodeVerifier) {
      return {
        success: false,
        error:
          "Session expired. Please tap 'Log in with TikTok' again, then paste the URL.",
      };
    }

    // Optionally verify state (skip if state doesn't match - user might have restarted)
    if (storedState && returnedState && storedState !== returnedState) {
      console.warn("⚠️ State mismatch, but continuing with manual flow");
    }

    // Exchange code for access token
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
        redirect_uri: FINAL_REDIRECT_URI,
        code_verifier: storedCodeVerifier,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();
    console.log("📥 Token response status:", tokenResponse.status);
    console.log("📥 Token response:", JSON.stringify(tokenData, null, 2));

    if (!tokenResponse.ok || tokenData.error) {
      console.error("❌ Token exchange error:", tokenData);
      return {
        success: false,
        error:
          tokenData.error_description ||
          tokenData.error ||
          `Token exchange failed (${tokenResponse.status})`,
      };
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || "";
    const expiresIn = tokenData.expires_in || 3600;

    if (!accessToken) {
      return { success: false, error: "No access token received" };
    }

    console.log("✅ Access token received");

    // Clear stored values
    storedCodeVerifier = null;
    storedState = null;

    // Fetch user info
    console.log("👤 Fetching user info...");

    const userInfoResponse = await fetch(TIKTOK_USER_INFO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfoData = await userInfoResponse.json();
    console.log("📥 User info response status:", userInfoResponse.status);

    // TikTok returns error object even on success with code "ok"
    const hasError =
      userInfoData.error &&
      userInfoData.error.code &&
      userInfoData.error.code !== "ok";
    if (!userInfoResponse.ok || hasError) {
      console.error("❌ User info error:", userInfoData);
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
  } catch (error) {
    console.error("❌ Error completing auth:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
