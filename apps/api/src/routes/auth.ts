import { Router } from "express";
import { LoginInput, UserPublic } from "@backoffice/shared";
import { validateBody } from "@/middleware/validate";
import { prisma } from "@/prisma/client";
import { verifyPassword } from "@/lib/password";
import { newCsrfToken } from "@/lib/csrf";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { clearAuthCookies, setAccessCookie, setRefreshCookie } from "@/lib/cookies";
import { requireAuth } from "@/middleware/requireAuth";

export const authRouter = Router();

authRouter.post("/login", validateBody(LoginInput), async (req, res) => {
  const { email, password } = req.body as any;

  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), isActive: true }
  });

  if (!user) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const csrf = newCsrfToken();
  const access = signAccessToken({ sub: user.id, tenantId: user.tenantId, role: user.role as any, csrf });
  const refresh = signRefreshToken({
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role as any,
    v: user.refreshTokenVersion
  });

  setAccessCookie(res, access);
  setRefreshCookie(res, refresh);

  const publicUser = UserPublic.parse({
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    phoneE164: user.phoneE164,
    role: user.role,
    isActive: user.isActive
  });

  return res.json({ user: publicUser, csrfToken: csrf });
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies?.bo_refresh;
  if (!token) return res.status(401).json({ error: "UNAUTHENTICATED" });

  try {
    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findFirst({
      where: { id: payload.sub, tenantId: payload.tenantId, isActive: true }
    });
    if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });

    if (user.refreshTokenVersion !== payload.v) {
      return res.status(401).json({ error: "UNAUTHENTICATED" });
    }

    const csrf = newCsrfToken();
    const access = signAccessToken({ sub: user.id, tenantId: user.tenantId, role: user.role as any, csrf });
    const refresh = signRefreshToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role as any,
      v: user.refreshTokenVersion
    });

    setAccessCookie(res, access);
    setRefreshCookie(res, refresh);

    const publicUser = UserPublic.parse({
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      phoneE164: user.phoneE164,
      role: user.role,
      isActive: user.isActive
    });

    return res.json({ user: publicUser, csrfToken: csrf });
  } catch {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  // invalidate refresh tokens by bumping the version
  await prisma.user.update({
    where: { id: req.auth!.userId },
    data: { refreshTokenVersion: { increment: 1 } }
  });

  clearAuthCookies(res);
  return res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: req.auth!.userId, tenantId: req.auth!.tenantId, isActive: true }
  });
  if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });

  const publicUser = UserPublic.parse({
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    phoneE164: user.phoneE164,
    role: user.role,
    isActive: user.isActive
  });

  return res.json({ user: publicUser });
});
