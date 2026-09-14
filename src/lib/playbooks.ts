import type { Platform } from "./types";

export const PLATFORM_META: Record<
  Platform,
  { label: string; handle: string; titleLimit: number; descLimit: number }
> = {
  youtube: { label: "YouTube", handle: "Long-form + Shorts", titleLimit: 70, descLimit: 5000 },
  linkedin: { label: "LinkedIn", handle: "Professional feed", titleLimit: 0, descLimit: 3000 },
  instagram: { label: "Instagram", handle: "Reels + carousel", titleLimit: 0, descLimit: 2200 },
  tiktok: { label: "TikTok", handle: "For You feed", titleLimit: 0, descLimit: 2200 },
};

export const AGENT_META: Record<
  string,
  { label: string; role: string }
> = {
  ingest: { label: "Ingest", role: "Accepts video, script, or Telegram payload." },
  transcriber: { label: "Transcriber", role: "Speech-to-text, chapters, spoken CTA." },
  analyst: { label: "Analyst", role: "Understands topic, audience, promise, tone." },
  seo: { label: "SEO strategist", role: "Keywords, intent, and discovery map." },
  writer: { label: "Platform writer", role: "Title, caption, tags per network." },
  publisher: { label: "Publisher", role: "Posts when credentials are live." },
  sentinel: { label: "Comment sentinel", role: "Replies, classifies, flags leads." },
  fulfillment: { label: "Fulfillment", role: "DMs promised documents to leads." },
};

export const PLAYBOOKS: Record<Platform, string> = {
  youtube: [
    "Title ≤70 chars, front-load the primary keyword, no clickbait all-caps.",
    "Description: 2-line hook, then value, then chapters, then links, then 8–12 tags.",
    "First 100 description characters must stand alone in search results.",
    "First comment: a question plus a resource tease, not a dump of hashtags.",
  ].join(" "),
  linkedin: [
    "No title field — the first two lines are the feed hook (≤140 characters before 'see more').",
    "Short paragraphs, one idea per line, end with a precise professional CTA.",
    "3–5 niche hashtags, never a block of 30. No slang, no engagement-bait.",
  ].join(" "),
  instagram: [
    "Line 1 is the cover hook. Then a 3–5 line story. CTA on its own line.",
    "8–15 hashtags after a line break, mix of 3 head terms and niche terms.",
    "Cover text ≤5 words. First comment: a question that invites saves.",
  ].join(" "),
  tiktok: [
    "Caption is a spoken-style hook the viewer can finish in 2 seconds.",
    "4–6 hashtags. Suggest on-screen text. Avoid hashtag stuffing.",
    "First comment: pin-worthy CTA or a part-2 tease.",
  ].join(" "),
};
