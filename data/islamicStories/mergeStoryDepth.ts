import type { IslamicStory } from "./types";
import type { StoryQuote } from "./quotes";

/** Extra sections (Qurʾān, hadith, narrations) keyed by story id — merged at catalog build time. */
export function mergeDepthSections(
  stories: IslamicStory[],
  depth: Partial<Record<string, IslamicStory["sections"]>>,
  quranQuotes?: Partial<Record<string, StoryQuote[]>>,
  hadithQuotes?: Partial<Record<string, StoryQuote[]>>
): IslamicStory[] {
  return stories.map((s) => {
    const extra = depth[s.id];
    const quran = quranQuotes?.[s.id] ?? [];
    const hadith = hadithQuotes?.[s.id] ?? [];

    const quoteSections: IslamicStory["sections"] = [];
    if (quran.length > 0) {
      quoteSections.push({
        title: "Qur'an Verse",
        paragraphs: quran.map((q) => `"${q.text}" (${q.source})`),
      });
    }
    if (hadith.length > 0) {
      quoteSections.push({
        title: "Hadith",
        paragraphs: hadith.map((h) => `"${h.text}" (${h.source})`),
      });
    }

    if (!extra?.length && quoteSections.length === 0) return s;
    return {
      ...s,
      sections: [...s.sections, ...(extra ?? []), ...quoteSections],
      sourceNote: `${s.sourceNote} Extended notes include referenced Qur'an verses and hadith quotations; verify exact editions/numbering with trusted printed or scholarly sources.`,
    };
  });
}
