import { Redirect } from "expo-router";

/**
 * Welcome redirects to the main login page for a consistent experience
 */
export default function WelcomeScreen() {
  return <Redirect href="/login" />;
}
