import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { router } from "@/routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger
    })
  );

  app.use(helmet());

  app.use(
    cors({
      origin: (origin, cb) => {
        const allowed = env.CORS_ORIGIN.split(",").map((s) => s.trim());
        if (!origin) return cb(null, true); // non-browser requests
        if (allowed.includes(origin)) return cb(null, true);
        return cb(new Error("CORS_NOT_ALLOWED"));
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Health
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Rate limit only login endpoint
  app.use(
    "/auth/login",
    rateLimit({
      windowMs: 60_000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use(router);

  // Errors
  app.use((err: any, _req: any, res: any, _next: any) => {
    logger.error({ err }, "Unhandled error");
    if (err?.message === "CORS_NOT_ALLOWED") return res.status(403).json({ error: "CORS_NOT_ALLOWED" });
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  });

  return app;
}
