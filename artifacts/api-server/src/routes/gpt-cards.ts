import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";
import { ilike } from "drizzle-orm";

const router: IRouter = Router();

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\s?#]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
}

async function getMercMajah() {
  const rows = await db.select().from(artistsTable).where(ilike(artistsTable.name, "%Merc Majah%")).limit(1);
  return rows[0] ?? null;
}

router.get("/profile-card", async (_req, res) => {
  try {
    const artist = await getMercMajah();
    if (!artist) {
      res.type("text/plain").send("Artist profile not available.");
      return;
    }

    const videos = (artist.musicVideos ?? []) as Array<{ title: string; url: string; year?: number; thumbnailUrl?: string }>;
    const merch = (artist.merch ?? {}) as Record<string, any>;

    const lines: string[] = [];
    lines.push(`# ${artist.name}`);
    if (artist.imageUrl) lines.push(`\n![${artist.name}](${artist.imageUrl})`);
    if (artist.shortBio) lines.push(`\n_${artist.shortBio}_`);
    lines.push(`\n${artist.bio}`);
    if (artist.origin || artist.formedYear) {
      const parts: string[] = [];
      if (artist.origin) parts.push(artist.origin);
      if (artist.formedYear) parts.push(`Est. ${artist.formedYear}`);
      lines.push(`\n**${parts.join(" • ")}**`);
    }
    if (artist.genres?.length) lines.push(`**Genre:** ${(artist.genres as string[]).join(", ")}`);

    if (videos.length > 0) {
      lines.push(`\n## Music Videos`);
      for (const v of videos) {
        const thumb = v.thumbnailUrl || getYouTubeThumbnail(v.url);
        const yearStr = v.year ? ` (${v.year})` : "";
        lines.push(`\n### ${v.title}${yearStr}`);
        if (thumb) lines.push(`[![${v.title}](${thumb})](${v.url})`);
        lines.push(`[▶ Watch on YouTube](${v.url})`);
      }
    }

    if (merch.name && merch.available !== false) {
      lines.push(`\n## Official Merch`);
      if (merch.imageUrl) lines.push(`\n![${merch.name}](${merch.imageUrl})`);
      lines.push(`**${merch.name}** — $${merch.price ?? "—"} ${merch.currency ?? "USD"}`);
      if (merch.description) lines.push(`\n${merch.description}`);
      if (merch.paymentLink) lines.push(`\n[🛒 Buy Now](${merch.paymentLink})`);
    }

    res.type("text/plain").send(lines.join("\n"));
  } catch (err) {
    res.status(500).type("text/plain").send("Error loading profile.");
  }
});

router.get("/merch-card", async (_req, res) => {
  try {
    const artist = await getMercMajah();
    const merch = (artist?.merch ?? {}) as Record<string, any>;

    if (!merch.name) {
      res.type("text/plain").send("No merch available.");
      return;
    }

    const lines: string[] = [];
    lines.push(`## ${merch.name}`);
    if (merch.imageUrl) lines.push(`\n![${merch.name}](${merch.imageUrl})`);
    lines.push(`\n**Price:** $${merch.price ?? "—"} ${merch.currency ?? "USD"}`);
    if (merch.description) lines.push(`\n${merch.description}`);
    if (merch.paymentLink) {
      lines.push(`\n[🛒 Buy Now — ${merch.name}](${merch.paymentLink})`);
      lines.push(`\nDirect link: ${merch.paymentLink}`);
    }

    res.type("text/plain").send(lines.join("\n"));
  } catch (err) {
    res.status(500).type("text/plain").send("Error loading merch.");
  }
});

export default router;
