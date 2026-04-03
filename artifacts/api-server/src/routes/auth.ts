import { Router, type IRouter } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const router: IRouter = Router();

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sign(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "fallback-dev-secret";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createToken(email: string): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${email}:${expires}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyToken(token: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = raw.lastIndexOf(".");
    if (lastDot === -1) return false;
    const payload = raw.slice(0, lastDot);
    const sig = raw.slice(lastDot + 1);
    const expected = sign(payload);
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return false;
    const parts = payload.split(":");
    const expires = parseInt(parts[parts.length - 1], 10);
    return Date.now() < expires;
  } catch {
    return false;
  }
}

router.post("/auth/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    res.status(503).json({ error: "Auth not configured" });
    return;
  }

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim().toLowerCase() !== adminEmail.toLowerCase() ||
    password !== adminPassword
  ) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = createToken(adminEmail);
  res.json({ token });
});

router.get("/auth/verify", (req, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !verifyToken(token)) {
    res.status(401).json({ valid: false });
    return;
  }
  res.json({ valid: true });
});

export default router;
