import { useEffect, useRef } from "react";
import { router, type Href } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { getWelcomeTourAcknowledged } from "@/utils/welcomeTourStorage";

/** First session after sign-in until the user finishes or skips the welcome tour. */
export function WelcomeMuslimSpaceHost() {
  const { user } = useAuth();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || firedRef.current) return;
    let alive = true;

    (async () => {
      const acknowledged = await getWelcomeTourAcknowledged(user.id);
      if (!alive || acknowledged) return;
      firedRef.current = true;
      router.replace("/(tabs)/profile/welcome-muslim-space?gate=1" as Href);
    })();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  return null;
}
