import "dotenv/config";
import { createApp } from "@/app";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const app = createApp();

/**
 * Render è dietro proxy (TLS termina sul proxy). Serve per:
 * - req.secure corretto
 * - cookie Secure / sessione funzionanti in produzione
 */
app.set("trust proxy", 1);

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "backoffice-api listening");
});
