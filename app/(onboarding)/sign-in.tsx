import { Redirect } from "expo-router";

/**
 * Sign-in redirects to the main login page for a consistent experience
 */
export default function SignInScreen() {
  return <Redirect href="/login" />;
}
