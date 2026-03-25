import type { IslamicStory, StoryCategory } from "./types";
import { prophetMuhammadStories } from "./prophetMuhammad";
import { otherProphetsStories } from "./otherProphets";
import { sahabaStories } from "./sahabaStories";
import { episodeIslamicStories } from "./episodeStories";
import { extraIslamicStories } from "./extraCorpus";
import { mergeDepthSections } from "./mergeStoryDepth";
import { SEERAH_DEPTH } from "./depth/seerahAndExtra";
import { ANBIYA_DEPTH } from "./depth/anbiya";
import { SAHABA_OVERVIEW_DEPTH } from "./depth/sahabaOverview";
import { EPISODES_DEPTH } from "./depth/episodes";
import { STORY_HADITH_QUOTES, STORY_QURAN_QUOTES } from "./quotes";

export type { IslamicStory, StoryCategory };

const STORY_DEPTH = {
  ...SEERAH_DEPTH,
  ...ANBIYA_DEPTH,
  ...SAHABA_OVERVIEW_DEPTH,
  ...EPISODES_DEPTH,
};

const RAW_STORIES: IslamicStory[] = [
  ...prophetMuhammadStories,
  ...otherProphetsStories,
  ...sahabaStories,
  ...episodeIslamicStories,
  ...extraIslamicStories,
];

const ALL: IslamicStory[] = mergeDepthSections(
  RAW_STORIES,
  STORY_DEPTH,
  STORY_QURAN_QUOTES,
  STORY_HADITH_QUOTES
);

const byId = new Map<string, IslamicStory>();
for (const s of ALL) {
  byId.set(s.id, s);
}

export function getAllIslamicStories(): IslamicStory[] {
  return ALL;
}

export function getIslamicStoryById(id: string): IslamicStory | undefined {
  return byId.get(id);
}

export function getStoriesByCategory(category: StoryCategory): IslamicStory[] {
  return ALL.filter((s) => s.category === category);
}

export const STORY_CATEGORY_LABEL: Record<StoryCategory, string> = {
  prophet_muhammad: "Prophet Muhammad ﷺ",
  prophets: "Other Prophets",
  sahaba: "Ṣaḥābah",
};
