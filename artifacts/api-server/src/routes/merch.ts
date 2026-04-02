import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const artists = await db
      .select({ merch: artistsTable.merch })
      .from(artistsTable)
      .limit(10);

    for (const row of artists) {
      const m = row.merch as Record<string, any> | null;
      if (m && m.name) {
        res.json({
          name: m.name,
          price: m.price ?? null,
          currency: m.currency ?? "USD",
          description: m.description ?? "",
          paymentLink: m.paymentLink ?? "",
          imageUrl: m.imageUrl ?? null,
          available: m.available ?? true,
        });
        return;
      }
    }

    res.status(404).json({ error: "No merch configured" });
  } catch {
    res.status(500).json({ error: "Failed to load merch" });
  }
});

export default router;
