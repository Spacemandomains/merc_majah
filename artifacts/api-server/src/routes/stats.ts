import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";
import { sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(artistsTable);
    const totalArtists = Number(count);

    const recentArtists = await db.select().from(artistsTable).orderBy(desc(artistsTable.createdAt)).limit(5);
    const recentlyAdded = recentArtists.map(a => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      bio: a.bio,
      shortBio: a.shortBio ?? undefined,
      genres: a.genres ?? [],
      origin: a.origin ?? undefined,
      formedYear: a.formedYear ?? undefined,
      imageUrl: a.imageUrl ?? undefined,
      socialLinks: a.socialLinks ?? {},
      discography: a.discography ?? [],
      pressQuotes: a.pressQuotes ?? [],
      bookingEmail: a.bookingEmail ?? undefined,
      pressEmail: a.pressEmail ?? undefined,
      labels: a.labels ?? [],
      members: a.members ?? [],
      tags: a.tags ?? [],
      llmContext: a.llmContext ?? undefined,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    const allArtists = await db.select({ genres: artistsTable.genres }).from(artistsTable);
    const genreCount: Record<string, number> = {};
    for (const row of allArtists) {
      if (Array.isArray(row.genres)) {
        for (const g of row.genres) {
          genreCount[g] = (genreCount[g] ?? 0) + 1;
        }
      }
    }

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    const totalGenres = Object.keys(genreCount).length;

    res.json({ totalArtists, totalGenres, recentlyAdded, topGenres });
  } catch (err) {
    req.log.error({ err }, "Error fetching stats");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch stats" });
  }
});

export default router;
