import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";
import { eq, ilike, sql, or, arrayContains } from "drizzle-orm";
import slugify from "slugify";

const router: IRouter = Router();

function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\s?#]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
}

function buildProfileCard(
  artist: typeof artistsTable.$inferSelect,
  musicVideos: Array<{ title: string; url: string; year?: number; thumbnailUrl?: string }>,
  merch: { name?: unknown; price?: unknown; currency?: unknown; description?: unknown; paymentLink?: unknown; imageUrl?: unknown; available?: unknown },
): string {
  const BASE = "https://merc-majah.vercel.app";
  const lines: string[] = [];
  lines.push(`# ${artist.name}`);
  if (artist.imageUrl) lines.push(`\n📸 [View Artist Photo](${BASE}/api/merc-majah/photo/artist)`);
  if (artist.shortBio) lines.push(`\n_${artist.shortBio}_`);
  if (artist.origin || artist.formedYear) {
    const parts: string[] = [];
    if (artist.origin) parts.push(artist.origin);
    if (artist.formedYear) parts.push(`Est. ${artist.formedYear}`);
    lines.push(`\n${parts.join(" • ")}`);
  }
  if (musicVideos.length > 0) {
    lines.push(`\n## Music Videos`);
    for (const v of musicVideos) {
      const yearStr = v.year ? ` (${v.year})` : "";
      lines.push(`\n### ${v.title}${yearStr}`);
      lines.push(`[▶ Watch on YouTube](${v.url})`);
    }
  }
  if (merch.name && merch.available !== false) {
    lines.push(`\n## Official Merch`);
    if (merch.imageUrl) lines.push(`\n🖼️ [View Merch Photo](${BASE}/api/merc-majah/photo/merch)`);
    lines.push(`**${merch.name}** — $${merch.price ?? "—"} ${merch.currency ?? "USD"}`);
    if (merch.description) lines.push(`\n${merch.description}`);
    if (merch.paymentLink) lines.push(`\n[🛒 Buy Now](${merch.paymentLink})`);
  }
  return lines.join("\n");
}

function mapArtist(artist: typeof artistsTable.$inferSelect) {
  const rawVideos = (artist.musicVideos ?? []) as Array<{ title: string; url: string; year?: number; description?: string; thumbnailUrl?: string }>;
  const musicVideos = rawVideos.map((v) => ({
    ...v,
    thumbnailUrl: v.thumbnailUrl || getYouTubeThumbnail(v.url) || undefined,
  }));

  const rawMerch = (artist.merch ?? {}) as Record<string, unknown>;
  const merch = {
    name: rawMerch.name ?? undefined,
    price: rawMerch.price ?? undefined,
    currency: rawMerch.currency ?? "USD",
    description: rawMerch.description ?? undefined,
    paymentLink: rawMerch.paymentLink ?? undefined,
    imageUrl: rawMerch.imageUrl ?? undefined,
    available: rawMerch.available ?? true,
  };

  return {
    id: artist.id,
    slug: artist.slug,
    name: artist.name,
    bio: artist.bio,
    shortBio: artist.shortBio ?? undefined,
    genres: artist.genres ?? [],
    origin: artist.origin ?? undefined,
    formedYear: artist.formedYear ?? undefined,
    imageUrl: artist.imageUrl ?? undefined,
    imageStoreUrl: artist.imageStoreUrl ?? undefined,
    socialLinks: artist.socialLinks ?? {},
    discography: artist.discography ?? [],
    musicVideos,
    pressQuotes: artist.pressQuotes ?? [],
    merch,
    bookingEmail: artist.bookingEmail ?? undefined,
    pressEmail: artist.pressEmail ?? undefined,
    labels: artist.labels ?? [],
    members: artist.members ?? [],
    tags: artist.tags ?? [],
    llmContext: artist.llmContext ?? undefined,
    profileCard: buildProfileCard(artist, musicVideos, merch),
    createdAt: artist.createdAt.toISOString(),
    updatedAt: artist.updatedAt.toISOString(),
  };
}

// GET /api/artists/search - must come before /:id
router.get("/search", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const genre = typeof req.query.genre === "string" ? req.query.genre : undefined;
  const limit = Math.min(parseInt(String(req.query.limit ?? "10")), 50);

  if (!q) {
    res.status(400).json({ error: "bad_request", message: "q parameter is required" });
    return;
  }

  try {
    let query = db.select().from(artistsTable).where(
      or(
        ilike(artistsTable.name, `%${q}%`),
        ilike(artistsTable.bio, `%${q}%`),
        ilike(artistsTable.shortBio, `%${q}%`),
        ilike(artistsTable.origin, `%${q}%`),
        sql`${artistsTable.genres}::text ilike ${'%' + q + '%'}`
      )
    ).limit(limit);

    const rows = await query;

    let results = rows.map(mapArtist);

    if (genre) {
      results = results.filter(a =>
        a.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
      );
    }

    res.json({ results, query: q, total: results.length });
  } catch (err) {
    req.log.error({ err }, "Error searching artists");
    res.status(500).json({ error: "internal_error", message: "Failed to search artists" });
  }
});

// GET /api/artists/slug/:slug - must come before /:id
router.get("/slug/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.slug, slug));
    if (!artist) {
      res.status(404).json({ error: "not_found", message: "Artist not found" });
      return;
    }
    res.json(mapArtist(artist));
  } catch (err) {
    req.log.error({ err }, "Error fetching artist by slug");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch artist" });
  }
});

// GET /api/artists
router.get("/", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(parseInt(String(req.query.limit ?? "20")), 100);
  const genre = typeof req.query.genre === "string" ? req.query.genre : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const offset = (page - 1) * limit;

  try {
    let baseQuery = db.select().from(artistsTable);

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(artistsTable.name, `%${search}%`),
          ilike(artistsTable.bio, `%${search}%`)
        )
      );
    }

    const rows = await baseQuery.limit(limit).offset(offset);
    let artists = rows.map(mapArtist);

    if (genre) {
      artists = artists.filter(a =>
        a.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
      );
    }

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(artistsTable);
    const total = Number(count);

    res.json({
      artists,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Error listing artists");
    res.status(500).json({ error: "internal_error", message: "Failed to list artists" });
  }
});

// POST /api/artists
router.post("/", async (req, res) => {
  const { name, bio, genres, slug: inputSlug, ...rest } = req.body;

  if (!name || !bio || !genres) {
    res.status(400).json({ error: "bad_request", message: "name, bio, and genres are required" });
    return;
  }

  let slug = inputSlug || generateSlug(name);

  try {
    const [existing] = await db.select({ id: artistsTable.id }).from(artistsTable).where(eq(artistsTable.slug, slug));
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const [artist] = await db.insert(artistsTable).values({
      name,
      slug,
      bio,
      genres: Array.isArray(genres) ? genres : [genres],
      ...rest,
    }).returning();

    res.status(201).json(mapArtist(artist));
  } catch (err) {
    req.log.error({ err }, "Error creating artist");
    res.status(500).json({ error: "internal_error", message: "Failed to create artist" });
  }
});

// GET /api/artists/:id
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "bad_request", message: "Invalid ID" });
    return;
  }

  try {
    const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.id, id));
    if (!artist) {
      res.status(404).json({ error: "not_found", message: "Artist not found" });
      return;
    }
    res.json(mapArtist(artist));
  } catch (err) {
    req.log.error({ err }, "Error fetching artist");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch artist" });
  }
});

// PUT /api/artists/:id
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "bad_request", message: "Invalid ID" });
    return;
  }

  try {
    const [existing] = await db.select({ id: artistsTable.id }).from(artistsTable).where(eq(artistsTable.id, id));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Artist not found" });
      return;
    }

    const { id: _id, createdAt: _c, updatedAt: _u, ...updateData } = req.body;

    const [artist] = await db.update(artistsTable)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(artistsTable.id, id))
      .returning();

    res.json(mapArtist(artist));
  } catch (err) {
    req.log.error({ err }, "Error updating artist");
    res.status(500).json({ error: "internal_error", message: "Failed to update artist" });
  }
});

// DELETE /api/artists/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "bad_request", message: "Invalid ID" });
    return;
  }

  try {
    const [existing] = await db.select({ id: artistsTable.id }).from(artistsTable).where(eq(artistsTable.id, id));
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Artist not found" });
      return;
    }

    await db.delete(artistsTable).where(eq(artistsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting artist");
    res.status(500).json({ error: "internal_error", message: "Failed to delete artist" });
  }
});

export default router;
