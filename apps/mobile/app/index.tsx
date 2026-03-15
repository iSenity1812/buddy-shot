import OnboardingScreen from "@/src/features/public/screens/onboarding-screen";
import { Redirect } from "expo-router";

export default function App() {
  // const user = useAuthStore((s) => s.user);
  // const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);

  // if (!hasSeenOnboarding) {
  //   return <OnboardingScreen />;
  // }

  // if (user) {
  //   return <Redirect href="/(main)" />;
  // }
  // return <Redirect href="/(auth)/login" />;

  return <OnboardingScreen />;
}
