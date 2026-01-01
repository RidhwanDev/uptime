import { Redirect } from "expo-router";

export default function Index() {
  // TODO: Add real auth check
  const isAuthenticated = false;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/login" />;
}
