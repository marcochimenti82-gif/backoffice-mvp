import { z } from "zod";

export const ReservationStatus = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);
export type ReservationStatus = z.infer<typeof ReservationStatus>;

export const ReservationListQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: ReservationStatus.optional(),
  q: z.string().optional()
});

export const ReservationPublic = z.object({
  id: z.string(),
  tenantId: z.string(),
  status: ReservationStatus,
  experienceType: z.string().nullable(),
  startAt: z.string().datetime(),
  durationMinutes: z.number().int(),
  pax: z.number().int(),
  notes: z.string().nullable(),
  assignedTableIds: z.array(z.string()),
  contact: z.object({
    id: z.string(),
    fullName: z.string(),
    phoneE164: z.string().nullable()
  }).nullable()
});

export const PatchReservationInput = z.object({
  startAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(24 * 60).optional(),
  pax: z.number().int().min(1).max(999).optional(),
  notes: z.string().max(4000).nullable().optional(),
  experienceType: z.string().max(200).nullable().optional(),
  assignedTableIds: z.array(z.string()).optional(),
  status: ReservationStatus.optional()
});

export type ReservationPublic = z.infer<typeof ReservationPublic>;
export type PatchReservationInput = z.infer<typeof PatchReservationInput>;
