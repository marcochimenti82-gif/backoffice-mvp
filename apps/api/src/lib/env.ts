import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(10000),
  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(20).or(z.string().min(1)), // allow short in dev
  JWT_REFRESH_SECRET: z.string().min(20).or(z.string().min(1)),

  CORS_ORIGIN: z.string().min(1),
  COOKIE_DOMAIN: z.string().optional().default(""),

  CORE_API_BASE_URL: z.string().optional().default(""),
  CORE_INTERNAL_TOKEN: z.string().optional().default("")
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  CORS_ORIGIN: process.env.CORS_ORIGIN,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN ?? "",

  CORE_API_BASE_URL: process.env.CORE_API_BASE_URL ?? "",
  CORE_INTERNAL_TOKEN: process.env.CORE_INTERNAL_TOKEN ?? ""
});
