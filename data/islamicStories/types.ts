export type StoryCategory = "prophet_muhammad" | "prophets" | "sahaba";

export interface IslamicStory {
  id: string;
  category: StoryCategory;
  title: string;
  tagline: string;
  /** @deprecated Not shown in UI — kept for older data compatibility */
  readMinutes?: number;
  sections: { title?: string; paragraphs: string[] }[];
  takeaway: string;
  /** Short note on sources or scholarly tradition — not a full citation */
  sourceNote: string;
}
