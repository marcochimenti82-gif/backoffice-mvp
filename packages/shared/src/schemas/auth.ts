import { z } from "zod";

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const UserPublic = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phoneE164: z.string().nullable(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "ACCOUNTING"]),
  isActive: z.boolean()
});

export type LoginInput = z.infer<typeof LoginInput>;
export type UserPublic = z.infer<typeof UserPublic>;
