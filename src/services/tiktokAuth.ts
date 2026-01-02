import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";

// Complete the web browser session when done
WebBrowser.maybeCompleteAuthSession();

// TikTok OAuth Configuration
// TODO: Replace with your actual TikTok app credentials from https://developers.tiktok.com/
const TIKTOK_CLIENT_KEY = process.env.EXPO_PUBLIC_TIKTOK_CLIENT_KEY || "";
const TIKTOK_CLIENT_SECRET = process.env.EXPO_PUBLIC_TIKTOK_CLIENT_SECRET || "";

// Debug: Log credentials (first few chars only for security)
console.log(
  "🔑 TikTok Client Key:",
  TIKTOK_CLIENT_KEY
    ? `${TIKTOK_CLIENT_KEY.substring(0, 8)}... (${
        TIKTOK_CLIENT_KEY.length
      } chars)`
    : "❌ NOT LOADED"
);
console.log(
  "🔑 TikTok Client Secret:",
  TIKTOK_CLIENT_SECRET
    ? `${TIKTOK_CLIENT_SECRET.substring(0, 8)}... (${
        TIKTOK_CLIENT_SECRET.length
      } chars)`
    : "❌ NOT LOADED"
);
// Full key for debugging (remove in production!)
console.log("🔍 Full Client Key (DEBUG):", TIKTOK_CLIENT_KEY);
console.log("🔍 Full Client Secret (DEBUG):", TIKTOK_CLIENT_SECRET);

// Construct Expo auth proxy URL (HTTPS required by TikTok)
// IMPORTANT: This must match EXACTLY what you entered in TikTok's redirect URI settings
// Check your TikTok app settings and use EXPO_PUBLIC_REDIRECT_URI if it differs
const getRedirectUri = (): string => {
  // First priority: Use environment variable (allows exact control)
  const customUri = process.env.EXPO_PUBLIC_REDIRECT_URI;
  if (customUri && customUri.startsWith("https://")) {
    return customUri;
  }

  // Second: Try to construct from Constants
  const owner =
    Constants.expoConfig?.owner ||
    Constants.manifest2?.extra?.expoClient?.owner;
  const slug =
    Constants.expoConfig?.slug ||
    Constants.manifest2?.extra?.expoClient?.slug ||
    "uptime-2";

  if (owner && slug) {
    // Format: https://auth.expo.io/username/slug (no @ symbol based on your TikTok settings)
    return `https://auth.expo.io/${owner}/${slug}`;
  }

  // Default fallback - UPDATE THIS to match your TikTok settings exactly
  return "https://auth.expo.io/ridhwanromjon/uptime-2";
};

const REDIRECT_URI = getRedirectUri();

// Log the redirect URI - copy this to TikTok sandbox settings
console.log("🔗 TikTok Redirect URI:", REDIRECT_URI);
console.log(
  "⚠️  If this shows @your-username, replace it with your Expo username in TikTok settings"
);

// TikTok API Endpoints
// Note: Sandbox and production use the same endpoints
// The difference is in the app configuration and test user access
const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";

// Sandbox mode indicator (for logging/debugging)
const IS_SANDBOX = process.env.EXPO_PUBLIC_TIKTOK_SANDBOX === "true" || true; // Default to true for now
console.log(
  "🧪 TikTok Sandbox Mode:",
  IS_SANDBOX ? "✅ Enabled" : "❌ Disabled"
);

interface TikTokAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

interface TikTokUserInfo {
  tiktokUserId: string;
  tiktokHandle: string;
}

export async function authenticateWithTikTok(): Promise<{
  success: boolean;
  tokens?: { accessToken: string; refreshToken: string; expiresIn: number };
  userInfo?: TikTokUserInfo;
  error?: string;
}> {
  try {
    if (!TIKTOK_CLIENT_KEY) {
      throw new Error(
        "TikTok Client Key is not configured. Please set EXPO_PUBLIC_TIKTOK_CLIENT_KEY in your .env file."
      );
    }

    // Step 1: Generate CSRF state token
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);

    // Step 2: Generate PKCE code verifier and challenge
    // Generate a random 32-byte code verifier (base64url encoded)
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    // Convert bytes to base64url string manually (React Native compatible)
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
    // Convert base64 to base64url
    const codeChallenge = hash
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    // Step 3: Build authorization URL according to TikTok's spec
    const scopes = "user.info.basic,video.list";
    const authUrl = new URL(TIKTOK_AUTH_URL);
    authUrl.searchParams.append("client_key", TIKTOK_CLIENT_KEY);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", scopes);
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");

    console.log("🔗 Authorization URL:", authUrl.toString());
    console.log("📍 Redirect URI:", REDIRECT_URI);
    console.log("🔑 Client Key:", TIKTOK_CLIENT_KEY);

    // Step 4: Set up redirect listener to log all URL changes
    console.log("🔍 Waiting for redirect URI:", REDIRECT_URI);
    console.log(
      "🔍 Redirect URI base (for matching):",
      REDIRECT_URI.split("?")[0]
    );

    let redirectResolve: ((url: string) => void) | undefined;
    let redirectReject: ((error: Error) => void) | undefined;
    const redirectPromise = new Promise<string>((resolve, reject) => {
      redirectResolve = resolve;
      redirectReject = reject;
    });

    const redirectBase = REDIRECT_URI.split("?")[0];
    // In Expo Go, auth.expo.io redirects to exp:// URLs, so we need to check for both
    const expoScheme = Constants.expoConfig?.scheme || "uptime";
    console.log("📋 Listening for URLs containing:", redirectBase);
    console.log("📋 Also listening for exp:// URLs with scheme:", expoScheme);
    console.log("📋 App scheme from config:", expoScheme);

    const subscription = Linking.addEventListener("url", (event) => {
      const { url } = event;
      console.log("🔗 URL EVENT RECEIVED:", url);
      console.log("🔍 Full redirect URI we're waiting for:", REDIRECT_URI);

      // Check if URL contains our redirect base (https://auth.expo.io/...)
      const matchesRedirectBase = url.includes(redirectBase);
      // Check if URL is an exp:// URL (Expo Go development redirect)
      const isExpoUrl =
        url.startsWith("exp://") || url.startsWith(`${expoScheme}://`);
      // Check if URL contains the code parameter (TikTok's redirect)
      const hasCode =
        url.includes("code=") ||
        url.includes("?code=") ||
        url.includes("&code=");

      console.log("🔍 Matches redirect base?", matchesRedirectBase);
      console.log("🔍 Is Expo URL?", isExpoUrl);
      console.log("🔍 Has code parameter?", hasCode);

      // Match if: (1) contains redirect base OR (2) is exp:// URL with code parameter
      if (matchesRedirectBase || (isExpoUrl && hasCode)) {
        console.log("✅ MATCH! This is our redirect URI!");
        if (redirectResolve) {
          redirectResolve(url);
        }
      } else {
        console.log("⏭️  Not our redirect, continuing to wait...");
      }
    });

    // Also check for initial URL (in case app was opened via deep link)
    const initialUrl = await Linking.getInitialURL();
    console.log("🔍 Initial URL (if app opened via deep link):", initialUrl);
    if (initialUrl) {
      const matchesRedirectBase = initialUrl.includes(redirectBase);
      const isExpoUrl =
        initialUrl.startsWith("exp://") ||
        initialUrl.startsWith(`${expoScheme}://`);
      const hasCode = initialUrl.includes("code=");

      if (matchesRedirectBase || (isExpoUrl && hasCode)) {
        console.log("✅ Initial URL matches! Using it.");
        if (redirectResolve) {
          redirectResolve(initialUrl);
        }
      }
    }

    // Step 5: Open browser and log all navigation
    console.log("🌐 Opening TikTok authorization page...");
    console.log("🌐 Authorization URL:", authUrl.toString());

    const browserResult = await WebBrowser.openBrowserAsync(authUrl.toString());
    console.log("📱 Browser opened, result:", browserResult);

    // Step 6: Wait for redirect (with timeout)
    console.log("⏳ Waiting for redirect... (timeout: 5 minutes)");
    let redirectUrl: string;
    try {
      redirectUrl = await Promise.race([
        redirectPromise.then((url) => {
          console.log("✅ Redirect promise resolved with URL:", url);
          return url;
        }),
        new Promise<string>((_, reject) =>
          setTimeout(() => {
            console.log("⏰ Redirect timeout after 5 minutes");
            reject(new Error("Redirect timeout"));
          }, 5 * 60 * 1000)
        ),
      ]);
    } catch (error) {
      console.error("❌ Error waiting for redirect:", error);
      subscription.remove();
      WebBrowser.dismissBrowser();
      return {
        success: false,
        error: error instanceof Error ? error.message : "Redirect timeout",
      };
    }

    // Clean up listener and close browser
    console.log("🧹 Cleaning up: removing listener and closing browser");
    subscription.remove();
    WebBrowser.dismissBrowser();

    // Step 7: Parse redirect URL to extract code
    console.log("📥 Final redirect URL received:", redirectUrl);

    let code: string | null = null;
    let returnedState: string | null = null;
    let error: string | null = null;
    let errorDescription: string | null = null;

    try {
      const parsedUrl = new URL(redirectUrl);
      code = parsedUrl.searchParams.get("code");
      returnedState = parsedUrl.searchParams.get("state");
      error = parsedUrl.searchParams.get("error");
      errorDescription = parsedUrl.searchParams.get("error_description");
    } catch (err) {
      // Fallback: extract from URL string directly
      const codeMatch = redirectUrl.match(/[?&]code=([^&]+)/);
      const stateMatch = redirectUrl.match(/[?&]state=([^&]+)/);
      const errorMatch = redirectUrl.match(/[?&]error=([^&]+)/);

      code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;
      returnedState = stateMatch ? decodeURIComponent(stateMatch[1]) : null;
      error = errorMatch ? decodeURIComponent(errorMatch[1]) : null;
    }

    if (error) {
      return {
        success: false,
        error: errorDescription || error || "Authorization failed",
      };
    }

    if (!code) {
      return {
        success: false,
        error: "No authorization code received",
      };
    }

    // Verify state matches (CSRF protection)
    if (returnedState !== state) {
      console.warn("⚠️ State mismatch:", {
        expected: state,
        received: returnedState,
      });
      return {
        success: false,
        error: "State mismatch - possible CSRF attack",
      };
    }

    // Step 2: Exchange authorization code for access token
    // Debug: Log the request details
    console.log("🔄 Exchanging code for token...");
    console.log("📍 Redirect URI:", REDIRECT_URI);
    console.log("🔑 Client Key:", TIKTOK_CLIENT_KEY);
    console.log("📝 Authorization Code:", code?.substring(0, 20) + "...");

    const requestBody = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier, // Include PKCE code verifier
    });

    console.log("📤 Request Body (without secret):", {
      client_key: TIKTOK_CLIENT_KEY,
      code: code?.substring(0, 20) + "...",
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      client_secret: "***hidden***",
    });
    console.log("🌐 Token URL:", TIKTOK_TOKEN_URL);

    const tokenResponse = await fetch(TIKTOK_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error("❌ Token exchange error:", errorData);
      return {
        success: false,
        error:
          errorData.error_description ||
          errorData.error ||
          "Failed to exchange code for token",
      };
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!access_token) {
      return {
        success: false,
        error: "No access token received",
      };
    }

    // Step 3: Fetch user info
    const userInfoResponse = await fetch(TIKTOK_USER_INFO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return {
        success: false,
        error: "Failed to fetch user info",
      };
    }

    const userInfoData = await userInfoResponse.json();
    const userInfo = userInfoData.data?.user;

    if (!userInfo) {
      return {
        success: false,
        error: "No user info received",
      };
    }

    return {
      success: true,
      tokens: {
        accessToken: access_token,
        refreshToken: refresh_token || "",
        expiresIn: expires_in || 3600,
      },
      userInfo: {
        tiktokUserId: userInfo.open_id || userInfo.union_id || "",
        tiktokHandle: userInfo.display_name || userInfo.username || "",
      },
    };
  } catch (error) {
    console.error("TikTok authentication error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
