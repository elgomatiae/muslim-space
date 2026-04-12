import { InteractionManager, Platform } from "react-native";

/**
 * Runs work after the rewarded interstitial has fully closed and the UI thread is idle.
 * EARNED_REWARD often fires before the native fullscreen ad is gone; callers should invoke
 * this only from AdEventType.CLOSED (after a reward) or after modal teardown on web.
 *
 * Extra macrotask delay gives GMA / Activity transitions time to release the window (reduces freezes).
 */
export function runAfterRewardGateTeardown(task: () => void | Promise<void>): void {
  const macrotaskMs = Platform.OS === "android" ? 200 : Platform.OS === "ios" ? 120 : 0;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      InteractionManager.runAfterInteractions(() => {
        const run = () => {
          requestAnimationFrame(() => {
            try {
              const out = task();
              if (out != null && typeof (out as Promise<unknown>).then === "function") {
                void (out as Promise<void>).catch((e) =>
                  console.error("[runAfterRewardGateTeardown]", e)
                );
              }
            } catch (e) {
              console.error("[runAfterRewardGateTeardown] sync", e);
            }
          });
        };

        if (macrotaskMs > 0) {
          setTimeout(run, macrotaskMs);
        } else {
          run();
        }
      });
    });
  });
}
