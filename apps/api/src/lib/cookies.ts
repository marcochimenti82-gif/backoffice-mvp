import type { Response } from "express";
import { env } from "@/lib/env";

type CookieOpts = {
  httpOnly: boolean;
  maxAgeMs: number;
};

function baseOptions(httpOnly: boolean) {
  const secure = env.NODE_ENV === "production";
  // In produzione (Render domini diversi => cross-site) servono cookie con SameSite=None
  const sameSite = env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const);
  const domain = env.COOKIE_DOMAIN?.trim() ? env.COOKIE_DOMAIN.trim() : undefined;

  return {
    httpOnly,
    secure,
    sameSite,
    domain,
    path: "/",
  };
}

export function setAccessCookie(
  res: Response,
  token: string,
  opts?: Partial<CookieOpts>
) {
  const maxAgeMs = opts?.maxAgeMs ?? 15 * 60 * 1000;
  res.cookie("bo_access", token, { ...baseOptions(true), maxAge: maxAgeMs });
}

export function setRefreshCookie(
  res: Response,
  token: string,
  opts?: Partial<CookieOpts>
) {
  const maxAgeMs = opts?.maxAgeMs ?? 30 * 24 * 60 * 60 * 1000;
  res.cookie("bo_refresh", token, { ...baseOptions(true), maxAge: maxAgeMs });
}

export function clearAuthCookies(res: Response) {
  const secure = env.NODE_ENV === "production";
  const sameSite = env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const);
  const domain = env.COOKIE_DOMAIN?.trim() ? env.COOKIE_DOMAIN.trim() : undefined;

  const base = {
    secure,
    sameSite,
    domain,
    path: "/",
  };

  res.clearCookie("bo_access", base);
  res.clearCookie("bo_refresh", base);
}
