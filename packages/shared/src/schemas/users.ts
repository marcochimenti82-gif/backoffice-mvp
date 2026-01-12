import { z } from "zod";

export const CreateUserInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phoneE164: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "ACCOUNTING"]),
  password: z.string().min(8)
});

export const PatchUserInput = z.object({
  name: z.string().min(1).optional(),
  phoneE164: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "ACCOUNTING"]).optional(),
  isActive: z.boolean().optional()
});

export type CreateUserInput = z.infer<typeof CreateUserInput>;
export type PatchUserInput = z.infer<typeof PatchUserInput>;
