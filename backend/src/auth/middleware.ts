import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string };
}

// Supabase signs session JWTs with a per-project key published at this well-known
// endpoint (ES256) — jose caches and rotates it for us.
const jwks = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "missing bearer token" });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, jwks);
    req.user = { id: payload.sub as string, email: payload.email as string };
    next();
  } catch {
    res.status(401).json({ error: "invalid or expired token" });
  }
}
