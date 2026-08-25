import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "missing bearer token" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.SUPABASE_JWT_SECRET) as jwt.JwtPayload;
    req.user = { id: payload.sub as string, email: payload.email as string };
    next();
  } catch {
    res.status(401).json({ error: "invalid or expired token" });
  }
}
