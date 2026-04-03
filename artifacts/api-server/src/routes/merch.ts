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
        const imageUrl = m.imageUrl ?? null;
        const paymentLink = m.paymentLink ?? "";
        const name = m.name;
        const price = m.price ?? null;
        const currency = m.currency ?? "USD";
        const description = m.description ?? "";

        const displayLines: string[] = [];
        displayLines.push(`## ${name}`);
        if (imageUrl) displayLines.push(`\n![${name}](${imageUrl})`);
        displayLines.push(`\n**Price:** $${price ?? "—"} ${currency}`);
        if (description) displayLines.push(`\n${description}`);
        if (paymentLink) displayLines.push(`\n[🛒 Buy Now — ${name}](${paymentLink})`);

        res.json({
          name,
          price,
          currency,
          description,
          paymentLink,
          imageUrl,
          available: m.available ?? true,
          display: displayLines.join("\n"),
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
