import type { RequestHandler } from "express";
import { verifyAccessToken } from "@/lib/jwt";

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.bo_access;
  if (!token) return res.status(401).json({ error: "UNAUTHENTICATED" });

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      csrf: payload.csrf
    };
    return next();
  } catch {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
};
