import crypto from "crypto";
import type { RequestHandler } from "express";

export function newCsrfToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * CSRF strategy:
 * - access token contains a random `csrf` claim
 * - client must send header `x-csrf-token` equal to that claim on unsafe methods
 */
export const requireCsrf: RequestHandler = (req, res, next) => {
  const method = req.method.toUpperCase();
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  if (!unsafe) return next();

  // allow login + refresh + logout without csrf header if you prefer; here we require it only if already authed
  if (!req.auth) return next();

  const header = req.header("x-csrf-token");
  if (!header || header !== req.auth.csrf) {
    return res.status(403).json({ error: "CSRF_INVALID" });
  }
  return next();
};
