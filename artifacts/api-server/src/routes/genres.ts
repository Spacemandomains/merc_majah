import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const artists = await db.select({ genres: artistsTable.genres }).from(artistsTable);
    const genreSet = new Set<string>();
    for (const row of artists) {
      if (Array.isArray(row.genres)) {
        for (const g of row.genres) {
          genreSet.add(g);
        }
      }
    }
    const genres = Array.from(genreSet).sort();
    res.json({ genres });
  } catch (err) {
    req.log.error({ err }, "Error fetching genres");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch genres" });
  }
});

export default router;
