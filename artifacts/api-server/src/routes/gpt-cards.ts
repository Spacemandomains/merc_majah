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

function baseUrl(req: any): string {
  const envUrl = process.env.API_BASE_URL?.trim();
  return envUrl ?? `${req.protocol}://${req.get("host")}`;
}

router.get("/photo/artist", async (req, res) => {
  try {
    const artist = await getMercMajah();
    const ownDomain = "merc-majah.vercel.app";
    if (!artist?.imageUrl || artist.imageUrl.includes(ownDomain)) { res.status(404).send("No source image configured"); return; }
    const upstream = await fetch(artist.imageUrl);
    if (!upstream.ok) { res.status(502).send("Upstream error"); return; }
    const buf = await upstream.arrayBuffer();
    res.set("Content-Type", upstream.headers.get("content-type") ?? "image/png");
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(Buffer.from(buf));
  } catch { res.status(500).send("Error"); }
});

router.get("/photo/merch", async (req, res) => {
  try {
    const artist = await getMercMajah();
    const merch = (artist?.merch ?? {}) as Record<string, any>;
    const ownDomain = "merc-majah.vercel.app";
    if (!merch.imageUrl || merch.imageUrl.includes(ownDomain)) { res.status(404).send("No source image configured"); return; }
    const upstream = await fetch(merch.imageUrl);
    if (!upstream.ok) { res.status(502).send("Upstream error"); return; }
    const buf = await upstream.arrayBuffer();
    res.set("Content-Type", upstream.headers.get("content-type") ?? "image/png");
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(Buffer.from(buf));
  } catch { res.status(500).send("Error"); }
});

router.get("/profile-card", async (req, res) => {
  try {
    const artist = await getMercMajah();
    if (!artist) { res.type("text/plain").send("Artist profile not available."); return; }

    const base = baseUrl(req);
    const artistPhotoUrl = artist.imageUrl ? `${base}/api/merc-majah/photo/artist` : null;

    const videos = (artist.musicVideos ?? []) as Array<{ title: string; url: string; year?: number; thumbnailUrl?: string }>;
    const merch = (artist.merch ?? {}) as Record<string, any>;
    const merchPhotoUrl = merch.imageUrl ? `${base}/api/merc-majah/photo/merch` : null;

    const lines: string[] = [];
    lines.push(`# ${artist.name}`);
    if (artistPhotoUrl) lines.push(`\n📸 [View Artist Photo](${artistPhotoUrl})`);
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
        const yearStr = v.year ? ` (${v.year})` : "";
        lines.push(`\n### ${v.title}${yearStr}`);
        lines.push(`[▶ Watch on YouTube](${v.url})`);
      }
    }

    if (merch.name && merch.available !== false) {
      lines.push(`\n## Official Merch`);
      if (merchPhotoUrl) lines.push(`\n🖼️ [View Merch Photo](${merchPhotoUrl})`);
      lines.push(`**${merch.name}** — $${merch.price ?? "—"} ${merch.currency ?? "USD"}`);
      if (merch.description) lines.push(`\n${merch.description}`);
      if (merch.paymentLink) lines.push(`\n[🛒 Buy Now](${merch.paymentLink})`);
    }

    res.type("text/plain").send(lines.join("\n"));
  } catch { res.status(500).type("text/plain").send("Error loading profile."); }
});

router.get("/merch-card", async (req, res) => {
  try {
    const artist = await getMercMajah();
    const merch = (artist?.merch ?? {}) as Record<string, any>;
    if (!merch.name) { res.type("text/plain").send("No merch available."); return; }

    const base = baseUrl(req);
    const merchPhotoUrl = merch.imageUrl ? `${base}/api/merc-majah/photo/merch` : null;

    const lines: string[] = [];
    lines.push(`## ${merch.name}`);
    if (merchPhotoUrl) lines.push(`\n🖼️ [View Photo](${merchPhotoUrl})`);
    lines.push(`**Price:** $${merch.price ?? "—"} ${merch.currency ?? "USD"}`);
    if (merch.description) lines.push(`\n${merch.description}`);
    if (merch.paymentLink) {
      lines.push(`\n[🛒 Buy Now — ${merch.name}](${merch.paymentLink})`);
      lines.push(`Direct link: ${merch.paymentLink}`);
    }

    res.type("text/plain").send(lines.join("\n"));
  } catch { res.status(500).type("text/plain").send("Error loading merch."); }
});

export default router;
