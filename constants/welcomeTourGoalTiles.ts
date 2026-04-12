import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { WelcomeTourChapterId } from "@/constants/welcomeTourChapters";

export type WelcomeGoalTileDef = {
  id: string;
  ios: string;
  android: keyof typeof MaterialIcons.glyphMap;
  /** `welcomeMuslimSpace.goalTiles.<id>` */
  labelKey: string;
};

/** Worship ring — optional goals only; fard prayers are always tracked in Iman, not toggled here. */
export const WELCOME_TOUR_IBADAH_TILES: WelcomeGoalTileDef[] = [
  { id: "sunnahTahajjud", ios: "sun.max.fill", android: "wb-sunny", labelKey: "sunnahTahajjud" },
  { id: "quran", ios: "book.fill", android: "menu-book", labelKey: "quran" },
  { id: "dhikrDua", ios: "hands.sparkles.fill", android: "auto-awesome", labelKey: "dhikrDua" },
  { id: "fasting", ios: "moon.stars.fill", android: "nights-stay", labelKey: "fasting" },
];

/** Knowledge ring */
export const WELCOME_TOUR_ILM_TILES: WelcomeGoalTileDef[] = [
  { id: "lectures", ios: "play.rectangle.fill", android: "play-circle-filled", labelKey: "lectures" },
  { id: "quizzes", ios: "questionmark.circle.fill", android: "quiz", labelKey: "quizzes" },
  { id: "reflection", ios: "pencil.and.outline", android: "edit-note", labelKey: "reflection" },
  { id: "stories", ios: "text.book.closed.fill", android: "auto-stories", labelKey: "stories" },
  { id: "allahNames", ios: "star.fill", android: "star", labelKey: "allahNames" },
];

/** Trust & wellbeing ring */
export const WELCOME_TOUR_AMANAH_TILES: WelcomeGoalTileDef[] = [
  { id: "exercise", ios: "figure.walk", android: "directions-walk", labelKey: "exercise" },
  { id: "water", ios: "drop.fill", android: "opacity", labelKey: "water" },
  { id: "sleep", ios: "bed.double.fill", android: "bed", labelKey: "sleep" },
  { id: "workouts", ios: "dumbbell.fill", android: "fitness-center", labelKey: "workouts" },
  { id: "meditation", ios: "leaf.fill", android: "spa", labelKey: "meditation" },
  { id: "journal", ios: "book.pages.fill", android: "menu-book", labelKey: "journal" },
];

export function welcomeTourTilesForChapter(_id: WelcomeTourChapterId): WelcomeGoalTileDef[] {
  return [];
}

/** @deprecated Ring slides merged into goalSetup; kept for type compatibility. */
export type WelcomeRingEmphasis = "outer" | "mid" | "inner";

export function welcomeTourRingEmphasis(_id: WelcomeTourChapterId): WelcomeRingEmphasis | null {
  return null;
}
