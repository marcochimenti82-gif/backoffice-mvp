import type { RequestHandler } from "express";
import type { Role } from "@backoffice/shared";

export function requireRole(allowed: Role[]): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: "UNAUTHENTICATED" });
    if (!allowed.includes(req.auth.role)) return res.status(403).json({ error: "FORBIDDEN" });
    return next();
  };
}
