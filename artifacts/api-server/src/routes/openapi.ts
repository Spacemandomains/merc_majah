import { Router, type IRouter } from "express";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { parse as parseYaml } from "yaml";

const router: IRouter = Router();

function loadSpec(req: { protocol: string; get: (h: string) => string | undefined }) {
  const candidates = [
    resolve(__dirname, "../../../lib/api-spec/openapi.yaml"),
    resolve(__dirname, "../../../../lib/api-spec/openapi.yaml"),
    resolve(process.cwd(), "lib/api-spec/openapi.yaml"),
  ];

  let raw: string | undefined;
  for (const p of candidates) {
    try {
      raw = readFileSync(p, "utf8");
      break;
    } catch {
    }
  }

  if (!raw) {
    throw new Error("openapi.yaml not found");
  }

  const spec = parseYaml(raw) as Record<string, unknown>;

  const host = req.get("host") ?? "localhost";
  const baseUrl = process.env.API_BASE_URL ?? `${req.protocol}://${host}`;
  spec.servers = [{ url: `${baseUrl}/api`, description: "Music Artist Directory API" }];

  return spec;
}

router.get("/openapi.json", (req, res) => {
  try {
    const spec = loadSpec(req);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(spec);
  } catch (err) {
    res.status(500).json({ error: "Failed to load OpenAPI spec", detail: String(err) });
  }
});

export default router;
