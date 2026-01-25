import { Redirect } from "expo-router";

/**
 * Sign-up redirects to the main login page for a consistent experience
 */
export default function SignUpScreen() {
  return <Redirect href="/login" />;
}
