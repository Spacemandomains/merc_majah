import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "freq_admin_token";
const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { valid: boolean };
    return data.valid === true;
  } catch {
    return false;
  }
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Login failed");
  }
  const data = (await res.json()) as { token: string };
  localStorage.setItem(TOKEN_KEY, data.token);
  return data.token;
}

type AuthState = "loading" | "authenticated" | "unauthenticated";

export function useAuth() {
  const [state, setState] = useState<AuthState>("loading");

  const check = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState("unauthenticated");
      return;
    }
    const valid = await verifyToken(token);
    setState(valid ? "authenticated" : "unauthenticated");
    if (!valid) clearToken();
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const logout = useCallback(() => {
    clearToken();
    setState("unauthenticated");
  }, []);

  return { state, logout, recheck: check };
}
