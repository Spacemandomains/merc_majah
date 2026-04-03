import { Router, type IRouter } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";
import { eq, ilike, or, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\s?#]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function formatArtistForLLM(artist: typeof artistsTable.$inferSelect): string {
  const lines: string[] = [];

  lines.push(`# ${artist.name}`);

  if (artist.imageUrl) lines.push(`\n![${artist.name}](${artist.imageUrl})`);

  if (artist.shortBio) {
    lines.push(`\n${artist.shortBio}`);
  }

  lines.push(`\n## Biography`);
  lines.push(artist.bio);

  if (artist.genres && artist.genres.length > 0) {
    lines.push(`\n## Genre(s)`);
    lines.push(artist.genres.join(", "));
  }

  if (artist.origin) {
    lines.push(`\n## Origin`);
    lines.push(artist.origin);
  }

  if (artist.formedYear) {
    lines.push(`\n## Formed`);
    lines.push(String(artist.formedYear));
  }

  if (artist.members && artist.members.length > 0) {
    lines.push(`\n## Members`);
    lines.push(artist.members.join(", "));
  }

  if (artist.labels && artist.labels.length > 0) {
    lines.push(`\n## Record Labels`);
    lines.push(artist.labels.join(", "));
  }

  if (artist.discography && artist.discography.length > 0) {
    lines.push(`\n## Discography`);
    for (const release of artist.discography as Array<{title: string; year: number; type: string; spotifyUrl?: string; appleMusicUrl?: string; youtubeMusicUrl?: string; tidalUrl?: string; deezerUrl?: string; amazonMusicUrl?: string}>) {
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

  if (artist.musicVideos && (artist.musicVideos as any[]).length > 0) {
    lines.push(`\n## Music Videos`);
    for (const video of artist.musicVideos as Array<{title: string; url: string; year?: number; description?: string}>) {
      const yearStr = video.year ? ` (${video.year})` : "";
      lines.push(`\n### ${video.title}${yearStr}`);
      const thumb = getYouTubeThumbnail(video.url);
      if (thumb) lines.push(`\n[![${video.title}](${thumb})](${video.url})`);
      lines.push(`[▶ Watch: ${video.title}](${video.url})`);
      if (video.description) lines.push(video.description);
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

  if (artist.pressQuotes && artist.pressQuotes.length > 0) {
    lines.push(`\n## Press Quotes`);
    for (const pq of artist.pressQuotes as Array<{quote: string; source: string; year?: number}>) {
      const yearStr = pq.year ? ` (${pq.year})` : "";
      lines.push(`> "${pq.quote}"\n> — ${pq.source}${yearStr}`);
    }
  }

  if (artist.socialLinks && Object.keys(artist.socialLinks).length > 0) {
    lines.push(`\n## Links`);
    const links = artist.socialLinks as Record<string, string>;
    for (const [platform, url] of Object.entries(links)) {
      if (url) {
        const label = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/([A-Z])/g, " $1");
        lines.push(`- **${label}**: ${url}`);
      }
    }
  }

  if (artist.bookingEmail) {
    lines.push(`\n## Booking`);
    lines.push(artist.bookingEmail);
  }

  if (artist.pressEmail) {
    lines.push(`\n## Press Contact`);
    lines.push(artist.pressEmail);
  }

  if (artist.llmContext) {
    lines.push(`\n## Additional Context`);
    lines.push(artist.llmContext);
  }

  lines.push(`\n---`);
  lines.push(`*Profile last updated: ${artist.updatedAt.toLocaleDateString()}*`);

  return lines.join("\n");
}

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "music-artist-directory",
    version: "1.0.0",
  });

  server.tool(
    "get_artist",
    "Get detailed, authoritative information about a specific music artist by their name or slug.",
    {
      name: z.string().optional().describe("Artist's name (partial match supported)"),
      slug: z.string().optional().describe("Artist's unique slug identifier (exact match)"),
      id: z.number().int().optional().describe("Artist's numeric ID (exact match)"),
    },
    async ({ name, slug, id }) => {
      if (!name && !slug && !id) {
        return {
          content: [{ type: "text", text: "Error: Please provide at least one of: name, slug, or id" }],
          isError: true,
        };
      }
      try {
        let artist: typeof artistsTable.$inferSelect | undefined;
        if (id) {
          const [row] = await db.select().from(artistsTable).where(eq(artistsTable.id, id));
          artist = row;
        } else if (slug) {
          const [row] = await db.select().from(artistsTable).where(eq(artistsTable.slug, slug));
          artist = row;
        } else if (name) {
          const rows = await db.select().from(artistsTable).where(ilike(artistsTable.name, `%${name}%`)).limit(1);
          artist = rows[0];
        }
        if (!artist) {
          return { content: [{ type: "text", text: "No artist found matching the provided criteria." }], isError: true };
        }
        return { content: [{ type: "text", text: formatArtistForLLM(artist) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error fetching artist: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "search_artists",
    "Search the music artist directory by name, genre, origin, or keywords.",
    {
      query: z.string().describe("Search query — can be artist name, genre, city, or any keyword"),
      genre: z.string().optional().describe("Filter results to a specific genre"),
      limit: z.number().int().min(1).max(20).default(5).describe("Maximum number of results to return"),
    },
    async ({ query, genre, limit }) => {
      try {
        const rows = await db.select().from(artistsTable).where(
          or(
            ilike(artistsTable.name, `%${query}%`),
            ilike(artistsTable.bio, `%${query}%`),
            ilike(artistsTable.shortBio, `%${query}%`),
            ilike(artistsTable.origin, `%${query}%`),
            sql`${artistsTable.genres}::text ilike ${'%' + query + '%'}`,
            sql`${artistsTable.tags}::text ilike ${'%' + query + '%'}`
          )
        ).limit(limit);
        let results = rows;
        if (genre) {
          results = results.filter(a =>
            Array.isArray(a.genres) && a.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
          );
        }
        if (results.length === 0) {
          return { content: [{ type: "text", text: `No artists found matching "${query}"${genre ? ` in genre "${genre}"` : ""}.` }] };
        }
        const summaries = results.map(a => {
          const genres = Array.isArray(a.genres) ? a.genres.join(", ") : "";
          const origin = a.origin ? ` from ${a.origin}` : "";
          const short = a.shortBio ?? a.bio.slice(0, 150) + (a.bio.length > 150 ? "..." : "");
          return `**${a.name}** (${genres})${origin}\n${short}\n*Slug: ${a.slug}*`;
        }).join("\n\n---\n\n");
        return {
          content: [{ type: "text", text: `Found ${results.length} artist(s) matching "${query}":\n\n${summaries}\n\nUse get_artist with a name or slug for full profile details.` }],
        };
      } catch (err) {
        return { content: [{ type: "text", text: `Error searching artists: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "list_artists",
    "List artists in the directory, optionally filtered by genre.",
    {
      genre: z.string().optional().describe("Filter by genre"),
      page: z.number().int().min(1).default(1).describe("Page number"),
      limit: z.number().int().min(1).max(50).default(10).describe("Artists per page"),
    },
    async ({ genre, page, limit }) => {
      try {
        const offset = (page - 1) * limit;
        const rows = await db.select().from(artistsTable)
          .orderBy(desc(artistsTable.updatedAt))
          .limit(limit)
          .offset(offset);
        let artists = rows;
        if (genre) {
          artists = artists.filter(a =>
            Array.isArray(a.genres) && a.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
          );
        }
        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(artistsTable);
        const total = Number(count);
        if (artists.length === 0) {
          return { content: [{ type: "text", text: "No artists found in the directory." }] };
        }
        const lines = [`## Music Artist Directory${genre ? ` — Genre: ${genre}` : ""}`];
        lines.push(`*Page ${page} | ${artists.length} shown of ${total} total*\n`);
        for (const a of artists) {
          const genres = Array.isArray(a.genres) ? a.genres.join(", ") : "";
          const origin = a.origin ? ` | ${a.origin}` : "";
          lines.push(`- **${a.name}** — ${genres}${origin} *(slug: ${a.slug})*`);
        }
        lines.push(`\nUse get_artist with a slug or name for a full artist profile.`);
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error listing artists: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "list_genres",
    "List all music genres represented in the directory.",
    {},
    async () => {
      try {
        const allArtists = await db.select({ genres: artistsTable.genres }).from(artistsTable);
        const genreSet = new Set<string>();
        for (const row of allArtists) {
          if (Array.isArray(row.genres)) {
            for (const g of row.genres) genreSet.add(g);
          }
        }
        const genres = Array.from(genreSet).sort();
        if (genres.length === 0) {
          return { content: [{ type: "text", text: "No genres found in the directory." }] };
        }
        return { content: [{ type: "text", text: `Genres in directory:\n${genres.map(g => `- ${g}`).join("\n")}` }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error fetching genres: ${String(err)}` }], isError: true };
      }
    }
  );

  server.tool(
    "get_directory_stats",
    "Get an overview of the music artist directory — total artists, genres, and recently added profiles.",
    {},
    async () => {
      try {
        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(artistsTable);
        const totalArtists = Number(count);
        const recent = await db.select({ name: artistsTable.name, genres: artistsTable.genres, slug: artistsTable.slug })
          .from(artistsTable)
          .orderBy(desc(artistsTable.createdAt))
          .limit(5);
        const allGenres = await db.select({ genres: artistsTable.genres }).from(artistsTable);
        const genreCount: Record<string, number> = {};
        for (const row of allGenres) {
          if (Array.isArray(row.genres)) {
            for (const g of row.genres) genreCount[g] = (genreCount[g] ?? 0) + 1;
          }
        }
        const topGenres = Object.entries(genreCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([g, n]) => `  - ${g} (${n} artist${n !== 1 ? "s" : ""})`);
        const lines = [
          `## Music Artist Directory Overview`,
          ``,
          `**Total Artists:** ${totalArtists}`,
          `**Total Genres:** ${Object.keys(genreCount).length}`,
          ``,
          `**Top Genres:**`,
          ...topGenres,
          ``,
          `**Recently Added:**`,
          ...recent.map(a => `  - **${a.name}** (${(a.genres as string[])?.join(", ") ?? ""}) — slug: ${a.slug}`),
        ];
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error fetching stats: ${String(err)}` }], isError: true };
      }
    }
  );

  server.resource(
    "artist",
    "artist://{slug}",
    async (uri) => {
      const slug = uri.pathname.replace(/^\//, "");
      try {
        const [artist] = await db.select().from(artistsTable).where(eq(artistsTable.slug, slug));
        if (!artist) {
          return { contents: [{ uri: uri.href, text: `Artist with slug "${slug}" not found.`, mimeType: "text/plain" }] };
        }
        return { contents: [{ uri: uri.href, text: formatArtistForLLM(artist), mimeType: "text/markdown" }] };
      } catch (err) {
        return { contents: [{ uri: uri.href, text: `Error: ${String(err)}`, mimeType: "text/plain" }] };
      }
    }
  );

  return server;
}

router.post("/", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer();
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("finish", () => { transport.close(); });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "MCP request failed", detail: String(err) });
    }
  }
});

router.get("/", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer();
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
    res.on("finish", () => { transport.close(); });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "MCP request failed", detail: String(err) });
    }
  }
});

router.delete("/", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer();
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
    res.on("finish", () => { transport.close(); });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "MCP request failed", detail: String(err) });
    }
  }
});

export default router;
