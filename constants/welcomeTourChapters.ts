/**
 * Welcome tour slide order (4 steps). Copy: locales → welcomeMuslimSpace.chapters.<id>.*
 */
export const WELCOME_TOUR_CHAPTERS = ["welcome", "imanTracker", "goalSetup", "resources"] as const;

export type WelcomeTourChapterId = (typeof WELCOME_TOUR_CHAPTERS)[number];
