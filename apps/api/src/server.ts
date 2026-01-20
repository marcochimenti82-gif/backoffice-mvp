import "dotenv/config";
import { createApp } from "@/app";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type AuthPayload = JwtPayload & {
  userId?: string;
  tenantId?: string;
  sub?: string;
};

type AuthedRequest = Request & {
  user?: {
    userId: string;
    tenantId?: string;
  };
};

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ success: false, error: "Missing Authorization Bearer token" });
  }

  // Prova a prendere la secret dall'env già centralizzato
  const secret =
    // @ts-expect-error - env potrebbe avere la chiave con nomi diversi
    (env.JWT_ACCESS_SECRET || env.JWT_SECRET || env.AUTH_JWT_SECRET) as string | undefined;

  if (!secret) {
    return res.status(500).json({ success: false, error: "JWT secret not configured on server" });
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthPayload;

    const userId = decoded.userId || decoded.sub;
    const tenantId = decoded.tenantId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Invalid token payload (missing userId)" });
    }

    req.user = { userId, tenantId };
    return next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

const app = createApp();

/**
 * ✅ FIX CRITICO: endpoint richiesto dal frontend dopo il login
 * La web sta chiamando "me" e riceve 404: qui lo implementiamo.
 */
app.get("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            timezone: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({ success: true, data: user });
  } catch (e) {
    logger.error({ err: e }, "GET /me failed");
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// (Opzionale) Risposta più chiara se qualcuno apre /auth/login in browser (GET)
app.get("/auth/login", (_req, res) => {
  res.status(405).json({ ok: false, message: "Use POST /auth/login" });
});

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info({ port: env.PORT }, "backoffice-api listening");
});

// Graceful shutdown (Render)
process.on("SIGTERM", async () => {
  try {
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
});
