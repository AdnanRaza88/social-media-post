# Relay

Your phone is the studio. Relay is a 24/7 social desk that transcribes a film, writes platform-specific titles and descriptions, queues posts to YouTube, LinkedIn, Instagram, and TikTok, then watches comments and DMs promised documents.

## What it does

1. **Ingest** — drop a video in Compose, paste a script, or send a film to a Telegram bot. This phone is the node.
2. **Transcribe** — Grok speech-to-text when you pass a public media URL.
3. **Understand** — topics, audience, hook, CTA, and any promised lead magnet.
4. **SEO + write** — a different pack per network (YouTube title rules, LinkedIn hook, Instagram cover text, TikTok caption).
5. **Publish** — queued until you add each network’s token in Settings. Copy pack is always available.
6. **Sentinel** — draft and send comment replies. Detect leads (`CHECKLIST`, `send me`, …).
7. **Fulfillment** — DM the vault document that matches the promise.

Eight agents share an MCP tool belt: `ingest_media`, `transcribe_audio`, `analyze_content`, `generate_seo_pack`, `draft_platform_post`, `publish_post`, `list_comments`, `classify_comment`, `reply_comment`, `match_vault_document`, `send_dm`, `telegram_poll`.

## Settings (keys stay on-device)

Open **Settings** in the app. Nothing is committed to git.

| Connector | What to paste |
| --- | --- |
| Telegram | BotFather token. The phone long-polls `getUpdates`. |
| YouTube | Data API key + OAuth access token. Channel ID in extra. |
| LinkedIn | Access token. Person URN (`urn:li:person:…`) in extra. |
| Instagram | Meta Graph token. IG business account ID in extra. |
| TikTok | Content Posting API token (approved app). |

Grok (xAI) is used for writing, SEO, and replies. Do not put that key in the client.

## Android APK

Native APK is a Capacitor WebView around the live desk so the node can stay in the foreground.

1. Deploy this app.
2. GitHub → Actions → **Build APK** → Run workflow → paste the HTTPS URL.
3. Download the `relay-debug-apk` artifact.

Until you sign a release keystore this is a debug APK (sideload, not Play Store).

## Local

```bash
npm install
npm run dev
```

API tokens belong in the Settings screen, not in `.env`.
