import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: Add auth check
  const isAuthenticated = false;
  
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/dashboard" />;
  }
  
  return <Redirect href="/(onboarding)/welcome" />;
}

