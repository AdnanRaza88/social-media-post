import { createServerFn } from "@tanstack/react-start";
import { draftCommentReply, runContentPipeline } from "./pipeline.server";
import type { Platform } from "./types";
import { grokSttFromUrl } from "./xai.server";

export const runDeskPipeline = createServerFn({ method: "POST" })
  .validator(
    (input: {
      titleHint?: string;
      script?: string;
      transcript?: string;
      platforms: Platform[];
      brandVoice: string;
      promisedHint?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    return runContentPipeline(data);
  });

export const replyToComment = createServerFn({ method: "POST" })
  .validator(
    (input: {
      brandVoice: string;
      postTitle: string;
      comment: string;
      isLead: boolean;
      promisedAsset?: string;
    }) => input,
  )
  .handler(async ({ data }) => draftCommentReply(data));

export const transcribeFromUrl = createServerFn({ method: "POST" })
  .validator((input: { url: string }) => input)
  .handler(async ({ data }) => grokSttFromUrl(data.url));

export const telegramGetUpdates = createServerFn({ method: "POST" })
  .validator((input: { token: string; offset: number }) => input)
  .handler(async ({ data }) => {
    const token = data.token.trim();
    if (!token) return { ok: false as const, error: "No Telegram bot token" };
    const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
    url.searchParams.set("offset", String(data.offset));
    url.searchParams.set("timeout", "8");
    url.searchParams.set("allowed_updates", JSON.stringify(["message"]));
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return { ok: false as const, error: `Telegram ${res.status}` };
    const json = (await res.json()) as {
      ok: boolean;
      result?: Array<{
        update_id: number;
        message?: {
          message_id: number;
          caption?: string;
          text?: string;
          from?: { first_name?: string; username?: string };
          video?: { file_id: string; file_name?: string; mime_type?: string };
          document?: { file_id: string; file_name?: string; mime_type?: string };
          chat?: { id: number };
        };
      }>;
      description?: string;
    };
    if (!json.ok) return { ok: false as const, error: json.description ?? "Telegram rejected the token" };
    return { ok: true as const, result: json.result ?? [] };
  });

export const telegramSend = createServerFn({ method: "POST" })
  .validator((input: { token: string; chatId: string; text: string }) => input)
  .handler(async ({ data }) => {
    const res = await fetch(`https://api.telegram.org/bot${data.token.trim()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: data.chatId, text: data.text }),
    });
    if (!res.ok) return { ok: false as const, error: `Telegram ${res.status}` };
    return { ok: true as const };
  });

export const publishToPlatform = createServerFn({ method: "POST" })
  .validator(
    (input: {
      platform: Platform;
      accessToken: string;
      apiKey: string;
      extra: string;
      title: string;
      description: string;
      tags: string[];
    }) => input,
  )
  .handler(async ({ data }): Promise<{ ok: true; url?: string } | { ok: false; error: string }> => {
    if (!data.accessToken && !data.apiKey) {
      return {
        ok: false,
        error: "Add an access token in Settings to publish. Drafts are ready to copy in the meantime.",
      };
    }
    try {
      if (data.platform === "youtube") {
        return await publishYouTube(data);
      }
      if (data.platform === "linkedin") {
        return await publishLinkedIn(data);
      }
      if (data.platform === "instagram") {
        return await publishInstagram(data);
      }
      return await publishTikTok(data);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Publish failed" };
    }
  });

async function publishYouTube(data: {
  accessToken: string;
  title: string;
  description: string;
  tags: string[];
}) {
  const res = await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        title: data.title.slice(0, 100),
        description: data.description,
        tags: data.tags.slice(0, 15),
        categoryId: "22",
      },
      status: { privacyStatus: "private", selfDeclaredMadeForKids: false },
    }),
  });
  const json = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok) {
    return {
      ok: false as const,
      error: json.error?.message ?? "YouTube declined the upload. A video file is required for a public publish — metadata-only was rejected.",
    };
  }
  return { ok: true as const, url: json.id ? `https://youtu.be/${json.id}` : undefined };
}

async function publishLinkedIn(data: { accessToken: string; extra: string; description: string }) {
  const author = data.extra.trim();
  if (!author.startsWith("urn:")) {
    return {
      ok: false as const,
      error: "Put your LinkedIn person URN (urn:li:person:…) in the extra field.",
    };
  }
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: data.description.slice(0, 3000) },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { ok: false as const, error: t.slice(0, 240) || `LinkedIn ${res.status}` };
  }
  return { ok: true as const, url: undefined };
}

async function publishInstagram(data: { accessToken: string; extra: string; description: string }) {
  const igUser = data.extra.trim();
  if (!igUser) {
    return { ok: false as const, error: "Put your Instagram business account ID in the extra field." };
  }
  const url = new URL(`https://graph.facebook.com/v21.0/${igUser}/media`);
  url.searchParams.set("caption", data.description.slice(0, 2200));
  url.searchParams.set("access_token", data.accessToken);
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    return {
      ok: false as const,
      error: "Instagram needs a public media URL plus a business account. Caption is ready — add the Graph token to go live.",
    };
  }
  return { ok: true as const, url: undefined as string | undefined };
}

async function publishTikTok(data: { accessToken: string; description: string }) {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: { title: data.description.slice(0, 150), privacy_level: "SELF_ONLY" },
      source_info: { source: "FILE_UPLOAD" },
    }),
  });
  if (!res.ok) {
    return {
      ok: false as const,
      error: "TikTok Content Posting API needs a creator-approved app. Caption is ready to paste in the meantime.",
    };
  }
  return { ok: true as const, url: undefined as string | undefined };
}

export const fetchPlatformComments = createServerFn({ method: "POST" })
  .validator(
    (input: { platform: Platform; accessToken: string; apiKey: string; videoId: string }) => input,
  )
  .handler(async ({ data }) => {
    if (data.platform !== "youtube" || (!data.apiKey && !data.accessToken)) {
      return { ok: false as const, error: "YouTube Data API key required to pull comments." };
    }
    const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("videoId", data.videoId);
    url.searchParams.set("maxResults", "20");
    if (data.apiKey) url.searchParams.set("key", data.apiKey);
    const headers: Record<string, string> = {};
    if (data.accessToken) headers.Authorization = `Bearer ${data.accessToken}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return { ok: false as const, error: `YouTube comments ${res.status}` };
    const json = (await res.json()) as {
      items?: Array<{
        id: string;
        snippet?: {
          topLevelComment?: {
            snippet?: { authorDisplayName?: string; textDisplay?: string; publishedAt?: string };
          };
        };
      }>;
    };
    const comments = (json.items ?? []).map((item) => ({
      id: item.id,
      author: item.snippet?.topLevelComment?.snippet?.authorDisplayName ?? "viewer",
      text: item.snippet?.topLevelComment?.snippet?.textDisplay ?? "",
      createdAt: item.snippet?.topLevelComment?.snippet?.publishedAt ?? new Date().toISOString(),
    }));
    return { ok: true as const, comments };
  });
