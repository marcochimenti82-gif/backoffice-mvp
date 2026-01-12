import jwt from "jsonwebtoken";
import { env } from "@/lib/env";
import type { Role } from "@backoffice/shared";

export type AccessTokenPayload = {
  sub: string; // user id
  tenantId: string;
  role: Role;
  csrf: string;
};

export type RefreshTokenPayload = {
  sub: string;
  tenantId: string;
  role: Role;
  v: number; // refresh_token_version from DB
};

export function signAccessToken(payload: AccessTokenPayload, expiresIn: string = "15m") {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn });
}

export function signRefreshToken(payload: RefreshTokenPayload, expiresIn: string = "30d") {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
