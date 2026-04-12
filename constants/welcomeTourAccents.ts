import type { WelcomeTourChapterId } from "@/constants/welcomeTourChapters";

export type WelcomeTourAccent = {
  solid: string;
  tint: string;
  edge: readonly [string, string];
};

export const WELCOME_TOUR_ACCENTS: Record<WelcomeTourChapterId, WelcomeTourAccent> = {
  welcome: { solid: "#8B5CF6", tint: "rgba(139,92,246,0.1)", edge: ["#C4B5FD", "#7C3AED"] },
  imanTracker: { solid: "#14B8A6", tint: "rgba(20,184,166,0.12)", edge: ["#5EEAD4", "#0D9488"] },
  goalSetup: { solid: "#8B5CF6", tint: "rgba(139,92,246,0.08)", edge: ["#A78BFA", "#7C3AED"] },
  resources: { solid: "#6366F1", tint: "rgba(99,102,241,0.1)", edge: ["#A5B4FC", "#4F46E5"] },
};
