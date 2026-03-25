import type { IslamicStory } from "@/data/islamicStories/types";

export type ReaderStep =
  | { kind: "welcome"; title: string; subtitle: string; categoryLabel: string }
  | { kind: "section"; title: string }
  | { kind: "body"; text: string; chunkIndex: number }
  | { kind: "reflection"; prompt: string; id: string }
  | { kind: "takeaway"; text: string }
  | { kind: "source"; text: string }
  | { kind: "finale"; message: string };

/** Larger chunks = longer “cards” per swipe in the story reader. */
const CHUNK_SOFT_MAX = 420;

function splitIntoSentences(text: string): string[] {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return [];
  return t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function chunkParagraph(paragraph: string): string[] {
  const sentences = splitIntoSentences(paragraph);
  if (sentences.length === 0) return [];
  const chunks: string[] = [];
  let buf = "";
  for (const s of sentences) {
    const next = buf ? `${buf} ${s}` : s;
    if (next.length <= CHUNK_SOFT_MAX) {
      buf = next;
    } else {
      if (buf) chunks.push(buf);
      if (s.length > CHUNK_SOFT_MAX) {
        const words = s.split(" ");
        let wbuf = "";
        for (const w of words) {
          const nw = wbuf ? `${wbuf} ${w}` : w;
          if (nw.length <= CHUNK_SOFT_MAX) wbuf = nw;
          else {
            if (wbuf) chunks.push(wbuf);
            wbuf = w;
          }
        }
        buf = wbuf;
      } else {
        buf = s;
      }
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

const REFLECTION_POOL = [
  "Pause — what part of this passage speaks to you today?",
  "Take a breath — what's one small way you could act on this?",
  "Reflect — what would it look like to live this lesson with sincerity?",
  "Consider — who might need your compassion after reading this?",
];

export function buildReaderSteps(story: IslamicStory, categoryLabel: string): ReaderStep[] {
  const steps: ReaderStep[] = [
    {
      kind: "welcome",
      title: story.title,
      subtitle: story.tagline,
      categoryLabel,
    },
  ];

  let bodyChunkCount = 0;
  let reflectionIdx = 0;

  story.sections.forEach((sec, secIdx) => {
    if (sec.title) {
      steps.push({ kind: "section", title: sec.title });
    }
    sec.paragraphs.forEach((para) => {
      const chunks = chunkParagraph(para);
      chunks.forEach((text) => {
        steps.push({ kind: "body", text, chunkIndex: bodyChunkCount });
        bodyChunkCount += 1;
        if (bodyChunkCount % 5 === 0) {
          const prompt = REFLECTION_POOL[reflectionIdx % REFLECTION_POOL.length];
          reflectionIdx += 1;
          steps.push({
            kind: "reflection",
            prompt,
            id: `r-${bodyChunkCount}`,
          });
        }
      });
    });
    if (secIdx < story.sections.length - 1) {
      const prompt = REFLECTION_POOL[reflectionIdx % REFLECTION_POOL.length];
      reflectionIdx += 1;
      steps.push({ kind: "reflection", prompt, id: `r-sec-${secIdx}` });
    }
  });

  steps.push({ kind: "takeaway", text: story.takeaway });
  steps.push({ kind: "source", text: story.sourceNote });
  steps.push({
    kind: "finale",
    message:
      "You have read this story to the end. When you are ready, use Track reading below — it counts toward your weekly Islamic Stories goal.",
  });

  return steps;
}

/** Tracking is enabled only on the final step, after the reader has finished the full path. */
export function getFirstStepIndexWhereCanTrack(steps: ReaderStep[]): number {
  const i = steps.findIndex((s) => s.kind === "finale");
  return i >= 0 ? i : Math.max(0, steps.length - 1);
}
