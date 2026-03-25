import AsyncStorage from "@react-native-async-storage/async-storage";

interface WeekTracked {
  weekKey: string;
  ids: string[];
}

function storageKey(userId: string) {
  return `storyReadingTracked_${userId}`;
}

/** ISO date (UTC) of the Sunday starting the current local week */
export function getWeekPeriodKey(): string {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = local.getDay();
  local.setDate(local.getDate() - day);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function loadWeekTracked(userId: string): Promise<WeekTracked> {
  const wk = getWeekPeriodKey();
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return { weekKey: wk, ids: [] };
    const parsed = JSON.parse(raw) as WeekTracked;
    if (!parsed.weekKey || parsed.weekKey !== wk) {
      return { weekKey: wk, ids: [] };
    }
    return { weekKey: parsed.weekKey, ids: Array.isArray(parsed.ids) ? parsed.ids : [] };
  } catch {
    return { weekKey: wk, ids: [] };
  }
}

export async function isStoryTrackedThisWeek(userId: string, storyId: string): Promise<boolean> {
  const { ids } = await loadWeekTracked(userId);
  return ids.includes(storyId);
}

export async function markStoryTrackedThisWeek(userId: string, storyId: string): Promise<void> {
  const wk = getWeekPeriodKey();
  const cur = await loadWeekTracked(userId);
  const baseIds = cur.weekKey === wk ? cur.ids : [];
  if (baseIds.includes(storyId)) return;
  const ids = [...baseIds, storyId];
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify({ weekKey: wk, ids }));
}
