import type { Response } from "express";
import { env } from "@/lib/env";

type CookieOpts = {
  httpOnly: boolean;
  maxAgeMs: number;
};

function baseOptions(httpOnly: boolean) {
  const secure = env.NODE_ENV === "production";
  const sameSite = "lax" as const; // same-site between subdomains (Render/custom domain)
  const domain = env.COOKIE_DOMAIN?.trim() ? env.COOKIE_DOMAIN.trim() : undefined;

  return {
    httpOnly,
    secure,
    sameSite,
    domain,
    path: "/"
  };
}

export function setAccessCookie(res: Response, token: string, opts?: Partial<CookieOpts>) {
  const maxAgeMs = opts?.maxAgeMs ?? 15 * 60 * 1000;
  res.cookie("bo_access", token, { ...baseOptions(true), maxAge: maxAgeMs });
}

export function setRefreshCookie(res: Response, token: string, opts?: Partial<CookieOpts>) {
  const maxAgeMs = opts?.maxAgeMs ?? 30 * 24 * 60 * 60 * 1000;
  res.cookie("bo_refresh", token, { ...baseOptions(true), maxAge: maxAgeMs });
}

export function clearAuthCookies(res: Response) {
  const domain = env.COOKIE_DOMAIN?.trim() ? env.COOKIE_DOMAIN.trim() : undefined;
  const base = {
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    domain,
    path: "/"
  };
  res.clearCookie("bo_access", base);
  res.clearCookie("bo_refresh", base);
}
