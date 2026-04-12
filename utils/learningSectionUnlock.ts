/**
 * In-memory unlock for Learning subsections after a rewarded ad.
 * One ad per section per app session; individual lectures/quizzes/stories/names do not re-show ads.
 * Cleared on sign-out.
 */
export type LearningSectionKey = "lectures" | "quizzes" | "stories" | "allah_names";

const unlocked = new Set<LearningSectionKey>();

export function isLearningSectionUnlocked(key: LearningSectionKey): boolean {
  return unlocked.has(key);
}

export function markLearningSectionUnlocked(key: LearningSectionKey): void {
  unlocked.add(key);
}

export function clearAllLearningSectionUnlocks(): void {
  unlocked.clear();
}
