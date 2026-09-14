import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/telegram")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        return Response.json({
          ok: true,
          ingested: Boolean(body),
          hint: "When the phone node is live it long-polls Telegram. This webhook is a fallback for always-on deploys.",
        });
      },
      GET: async () =>
        Response.json({
          ok: true,
          service: "relay-telegram",
        }),
    },
  },
});
