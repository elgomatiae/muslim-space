import AsyncStorage from "@react-native-async-storage/async-storage";

/** Stable key so renaming the tour UI does not reset completion for existing users. */
const keyFor = (userId: string) => `@atlas_welcome_ack_v1:${userId}`;

export async function getWelcomeTourAcknowledged(userId: string): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(keyFor(userId));
    return v === "1";
  } catch {
    return false;
  }
}

export async function setWelcomeTourAcknowledged(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId), "1");
  } catch {
    /* non-fatal */
  }
}
