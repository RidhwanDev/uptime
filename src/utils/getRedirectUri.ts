import * as AuthSession from "expo-auth-session";

/**
 * Get the redirect URI for TikTok OAuth
 * This uses Expo's proxy which provides an HTTPS URL
 * Format: https://auth.expo.io/@your-username/your-app-slug
 */
export function getRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    useProxy: true,
  });
}

// Log the redirect URI so you can copy it to TikTok settings
console.log("TikTok Redirect URI:", getRedirectUri());
