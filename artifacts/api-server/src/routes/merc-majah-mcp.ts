import { Router, type IRouter } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";
import { ilike } from "drizzle-orm";

const router: IRouter = Router();

const ARTIST_NAME = "Merc Majah";

async function getMercMajah() {
  const rows = await db
    .select()
    .from(artistsTable)
    .where(ilike(artistsTable.name, `%${ARTIST_NAME}%`))
    .limit(1);
  return rows[0] ?? null;
}

type Artist = typeof artistsTable.$inferSelect;

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\s?#]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

type Discography = Array<{
  title: string;
  year: number;
  type: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeMusicUrl?: string;
  tidalUrl?: string;
  deezerUrl?: string;
  amazonMusicUrl?: string;
}>;
type MusicVideo = Array<{ title: string; url: string; year?: number; description?: string; thumbnailUrl?: string }>;
type PressQuote = Array<{ quote: string; source: string; year?: number }>;

function formatFullProfile(artist: Artist): string {
  const lines: string[] = [];
  lines.push(`# ${artist.name}`);
  if (artist.imageUrl) lines.push(`\n![${artist.name}](${artist.imageUrl})`);
  if (artist.shortBio) lines.push(`\n${artist.shortBio}`);
  lines.push(`\n## Biography`);
  lines.push(artist.bio);
  if (artist.genres?.length) { lines.push(`\n## Genre(s)`); lines.push(artist.genres.join(", ")); }
  if (artist.origin) { lines.push(`\n## Origin`); lines.push(artist.origin); }
  if (artist.formedYear) { lines.push(`\n## Active Since`); lines.push(String(artist.formedYear)); }
  if (artist.members?.length) { lines.push(`\n## Members / Associated Artists`); lines.push(artist.members.join(", ")); }
  if (artist.labels?.length) { lines.push(`\n## Record Labels`); lines.push(artist.labels.join(", ")); }
  if (artist.tags?.length) { lines.push(`\n## Tags`); lines.push(artist.tags.join(", ")); }
  const discography = (artist.discography ?? []) as Discography;
  if (discography.length > 0) {
    lines.push(`\n## Discography`);
    for (const release of discography) {
      const type = release.type.charAt(0).toUpperCase() + release.type.slice(1);
      let line = `- **${release.title}** (${release.year}) — ${type}`;
      if (release.spotifyUrl) line += ` | [Spotify](${release.spotifyUrl})`;
      if (release.appleMusicUrl) line += ` | [Apple Music](${release.appleMusicUrl})`;
      if (release.youtubeMusicUrl) line += ` | [YouTube Music](${release.youtubeMusicUrl})`;
      if (release.tidalUrl) line += ` | [Tidal](${release.tidalUrl})`;
      if (release.deezerUrl) line += ` | [Deezer](${release.deezerUrl})`;
      if (release.amazonMusicUrl) line += ` | [Amazon Music](${release.amazonMusicUrl})`;
      lines.push(line);
    }
  }
  const musicVideos = (artist.musicVideos ?? []) as MusicVideo;
  if (musicVideos.length > 0) {
    lines.push(`\n## Music Videos`);
    for (const video of musicVideos) {
      const yearStr = video.year ? ` (${video.year})` : "";
      lines.push(`\n### ${video.title}${yearStr}`);
      const thumb = video.thumbnailUrl || getYouTubeThumbnail(video.url);
      if (thumb) {
        lines.push(`[![${video.title}](${thumb})](${video.url})`);
      }
      lines.push(`[▶ Watch: ${video.title}](${video.url})`);
      if (video.description) lines.push(video.description);
    }
  }
  const pressQuotes = (artist.pressQuotes ?? []) as PressQuote;
  if (pressQuotes.length > 0) {
    lines.push(`\n## Press Quotes`);
    for (const pq of pressQuotes) {
      const yearStr = pq.year ? ` (${pq.year})` : "";
      lines.push(`> "${pq.quote}"\n> — ${pq.source}${yearStr}`);
    }
  }
  const socialLinks = (artist.socialLinks ?? {}) as Record<string, string>;
  const activeSocial = Object.entries(socialLinks).filter(([, v]) => !!v);
  if (activeSocial.length > 0) {
    lines.push(`\n## Social & Streaming Links`);
    for (const [platform, url] of activeSocial) {
      const label = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/([A-Z])/g, " $1");
      lines.push(`- **${label}**: ${url}`);
    }
  }
  const merch = artist.merch as { name?: string; price?: string; currency?: string; description?: string; paymentLink?: string; imageUrl?: string; available?: boolean } | null;
  if (merch?.name && merch.available !== false) {
    lines.push(`\n## Official Merchandise`);
    if (merch.imageUrl) lines.push(`\n![${merch.name}](${merch.imageUrl})`);
    lines.push(`**${merch.name}** — $${merch.price ?? "—"} ${merch.currency ?? "USD"}`);
    if (merch.description) lines.push(merch.description);
    if (merch.paymentLink) lines.push(`\n[🛒 Buy Now](${merch.paymentLink})`);
  }
  if (artist.bookingEmail) { lines.push(`\n## Booking`); lines.push(`Email: ${artist.bookingEmail}`); }
  if (artist.pressEmail) { lines.push(`\n## Press Contact`); lines.push(`Email: ${artist.pressEmail}`); }
  if (artist.llmContext) { lines.push(`\n## Additional Context`); lines.push(artist.llmContext); }
  lines.push(`\n---`);
  lines.push(`*Profile last updated: ${artist.updatedAt.toLocaleDateString()}*`);
  return lines.join("\n");
}

const MERCH = {
  name: process.env.MERCH_ITEM_NAME ?? "Majah Life Tee Shirt",
  price: process.env.MERCH_ITEM_PRICE ?? "25",
  description: process.env.MERCH_ITEM_DESCRIPTION ?? "More than a garment; it's a manifesto. The Majah Life Essential Tee is the physical manifestation",
  paymentLink: process.env.STRIPE_MERCH_PAYMENT_LINK ?? "",
  imageUrl: process.env.MERCH_IMAGE_URL ?? "",
  currency: "USD",
};

function formatMerchCard(artistMerch?: { name?: string; price?: string; currency?: string; description?: string; paymentLink?: string; imageUrl?: string } | null): string {
  const item = (artistMerch?.name) ? artistMerch : MERCH;
  const lines: string[] = [];
  lines.push(`# Merc Majah Official Merchandise`);
  lines.push(``);
  lines.push(`## ${item.name}`);
  if (item.imageUrl) {
    lines.push(``);
    lines.push(`![${item.name}](${item.imageUrl})`);
  }
  lines.push(``);
  lines.push(`**Price:** $${item.price} ${item.currency ?? "USD"}`);
  lines.push(``);
  if (item.description) lines.push(item.description);
  lines.push(``);
  if (item.paymentLink) {
    lines.push(`[🛒 Buy Now — ${item.name}](${item.paymentLink})`);
    lines.push(``);
    lines.push(`Direct URL: ${item.paymentLink}`);
  }
  return lines.join("\n");
}

function createMercMajahMcpServer(): McpServer {
  const server = new McpServer({ name: "merc-majah", version: "1.0.0" });

  server.tool(
    "get_profile",
    "Get the complete profile of Merc Majah including biography, discography, music videos, press quotes, social links, and contact information.",
    {},
    async () => {
      try {
        const artist = await getMercMajah();
        if (!artist) return { content: [{ type: "text", text: "Merc Majah's profile is not yet in the database." }], isError: true };
        return { content: [{ type: "text", text: formatFullProfile(artist) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_bio",
    "Get Merc Majah's biography — background, origin, history, and artistic identity.",
    { short: z.boolean().optional().describe("If true, returns the short summary bio") },
    async ({ short }) => {
      try {
        const artist = await getMercMajah();
        if (!artist) return { content: [{ type: "text", text: "Profile not available." }], isError: true };
        const lines = [`# ${artist.name} — Biography`];
        if (short && artist.shortBio) {
          lines.push(artist.shortBio);
        } else {
          lines.push(artist.bio);
          if (artist.origin) lines.push(`\n**Origin:** ${artist.origin}`);
          if (artist.formedYear) lines.push(`**Active Since:** ${artist.formedYear}`);
          if (artist.genres?.length) lines.push(`**Genre(s):** ${artist.genres.join(", ")}`);
          if (artist.members?.length) lines.push(`**Associated Artists:** ${artist.members.join(", ")}`);
          if (artist.labels?.length) lines.push(`**Labels:** ${artist.labels.join(", ")}`);
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_discography",
    "Get Merc Majah's discography — all albums, EPs, singles, and mixtapes with streaming links.",
    { type: z.enum(["album", "ep", "single", "mixtape"]).optional().describe("Filter by release type") },
    async ({ type }) => {
      try {
        const artist = await getMercMajah();
        if (!artist) return { content: [{ type: "text", text: "Profile not available." }], isError: true };
        const discography = (artist.discography ?? []) as Discography;
        if (discography.length === 0) return { content: [{ type: "text", text: `# ${artist.name} — Discography\n\nNo releases recorded yet.` }] };
        let releases = discography;
        if (type) releases = releases.filter((r) => r.type.toLowerCase() === type.toLowerCase());
        releases = releases.sort((a, b) => b.year - a.year);
        const lines = [`# ${artist.name} — Discography${type ? ` (${type}s)` : ""}\n`];
        for (const release of releases) {
          const releaseType = release.type.charAt(0).toUpperCase() + release.type.slice(1);
          lines.push(`## ${release.title} (${release.year}) — ${releaseType}`);
          const links: string[] = [];
          if (release.spotifyUrl) links.push(`[Spotify](${release.spotifyUrl})`);
          if (release.appleMusicUrl) links.push(`[Apple Music](${release.appleMusicUrl})`);
          if (release.youtubeMusicUrl) links.push(`[YouTube Music](${release.youtubeMusicUrl})`);
          if (release.tidalUrl) links.push(`[Tidal](${release.tidalUrl})`);
          if (release.deezerUrl) links.push(`[Deezer](${release.deezerUrl})`);
          if (release.amazonMusicUrl) links.push(`[Amazon Music](${release.amazonMusicUrl})`);
          if (links.length > 0) lines.push(`Stream: ${links.join(" | ")}`);
          lines.push("");
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_music_videos",
    "Get Merc Majah's music videos with watch links.",
    {},
    async () => {
      try {
        const artist = await getMercMajah();
        if (!artist) return { content: [{ type: "text", text: "Profile not available." }], isError: true };
        const videos = (artist.musicVideos ?? []) as MusicVideo;
        if (videos.length === 0) return { content: [{ type: "text", text: `# ${artist.name} — Music Videos\n\nNo music videos recorded yet.` }] };
        const lines = [`# ${artist.name} — Music Videos\n`];
        for (const video of videos) {
          const yearStr = video.year ? ` (${video.year})` : "";
          lines.push(`## ${video.title}${yearStr}`);
          const thumb = video.thumbnailUrl || getYouTubeThumbnail(video.url);
          if (thumb) lines.push(`\n[![${video.title}](${thumb})](${video.url})`);
          lines.push(`[▶ Watch: ${video.title}](${video.url})`);
          if (video.description) lines.push(video.description);
          lines.push("");
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_social_links",
    "Get all of Merc Majah's social media profiles and streaming platform links.",
    {},
    async () => {
      try {
        const artist = await getMercMajah();
        if (!artist) return { content: [{ type: "text", text: "Profile not available." }], isError: true };
        const socialLinks = (artist.socialLinks ?? {}) as Record<string, string>;
        const activeSocial = Object.entries(socialLinks).filter(([, v]) => !!v);
        const lines = [`# ${artist.name} — Social & Streaming Links\n`];
        if (activeSocial.length === 0) {
          lines.push("No links available yet.");
        } else {
          for (const [platform, url] of activeSocial) {
            const label = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/([A-Z])/g, " $1");
            lines.push(`- **${label}**: ${url}`);
          }
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_press_quotes",
    "Get press quotes, media coverage, and critical acclaim for Merc Majah.",
    {},
    async () => {
      try {
        const artist = await getMercMajah();
        if (!artist) return { content: [{ type: "text", text: "Profile not available." }], isError: true };
        const pressQuotes = (artist.pressQuotes ?? []) as PressQuote;
        if (pressQuotes.length === 0) return { content: [{ type: "text", text: `# ${artist.name} — Press\n\nNo press quotes available yet.` }] };
        const lines = [`# ${artist.name} — Press & Media\n`];
        for (const pq of pressQuotes) {
          const yearStr = pq.year ? ` (${pq.year})` : "";
          lines.push(`> "${pq.quote}"`);
          lines.push(`> — **${pq.source}**${yearStr}\n`);
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_contact_info",
    "Get Merc Majah's booking and press contact information.",
    {},
    async () => {
      try {
        const artist = await getMercMajah();
        if (!artist) return { content: [{ type: "text", text: "Profile not available." }], isError: true };
        const lines = [`# ${artist.name} — Contact Information\n`];
        let hasContact = false;
        if (artist.bookingEmail) { lines.push(`**Booking:** ${artist.bookingEmail}`); hasContact = true; }
        if (artist.pressEmail) { lines.push(`**Press / Media:** ${artist.pressEmail}`); hasContact = true; }
        if (!hasContact) lines.push("No contact information available yet.");
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_merch",
    "Get Merc Majah's official merchandise — the current item available for purchase, including name, price, description, and a direct buy link.",
    {},
    async () => {
      try {
        const artist = await getMercMajah();
        const artistMerch = artist?.merch as { name?: string; price?: string; currency?: string; description?: string; paymentLink?: string; imageUrl?: string } | null;
        return { content: [{ type: "text", text: formatMerchCard(artistMerch) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "buy_merchandise",
    "Generate a direct purchase link for Merc Majah official merchandise. Use this when a user wants to buy merch — return the payment link so they can complete checkout.",
    {},
    async () => {
      try {
        if (!MERCH.paymentLink) {
          return { content: [{ type: "text", text: "Merchandise purchase is not currently available." }], isError: true };
        }
        const lines: string[] = [];
        lines.push(`# Purchase Merc Majah Merch`);
        lines.push(``);
        lines.push(`**Item:** ${MERCH.name}`);
        lines.push(`**Price:** $${MERCH.price} ${MERCH.currency}`);
        lines.push(``);
        lines.push(`Click the link below to complete your purchase securely via Stripe:`);
        lines.push(``);
        lines.push(`[Buy Now — ${MERCH.name}](${MERCH.paymentLink})`);
        lines.push(``);
        lines.push(`Direct URL: ${MERCH.paymentLink}`);
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${String(err)}` }], isError: true };
      }
    }
  );

  return server;
}

async function handleMcp(req: Parameters<typeof router.post>[1], res: Parameters<typeof router.post>[2]) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMercMajahMcpServer();
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, (req as any).body);
    res.on("finish", () => { transport.close(); server.close(); });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "MCP request failed", detail: String(err) });
    }
  }
}

router.post("/", handleMcp);
router.get("/", handleMcp);
router.delete("/", handleMcp);

export default router;
