import { Router } from "express";
import { ReservationListQuery, PatchReservationInput, ReservationPublic } from "@backoffice/shared";
import { requireAuth } from "@/middleware/requireAuth";
import { requireRole } from "@/middleware/requireRole";
import { validateQuery, validateBody } from "@/middleware/validate";
import { prisma } from "@/prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { syncReservation } from "@/lib/coreCalendarAdapter";
import { requireCsrf } from "@/lib/csrf";

export const reservationsRouter = Router();

// tenant-aware list
reservationsRouter.get(
  "/",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "STAFF", "ACCOUNTING"]),
  validateQuery(ReservationListQuery),
  async (req, res) => {
    const { from, to, status, q } = req.query as any;

    const where: any = {
      tenantId: req.auth!.tenantId
    };

    if (status) where.status = status;

    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = new Date(from);
      if (to) where.startAt.lte = new Date(to);
    }

    if (q) {
      where.OR = [
        { contact: { fullName: { contains: q, mode: "insensitive" } } },
        { contact: { phoneE164: { contains: q } } }
      ];
    }

    const rows = await prisma.reservation.findMany({
      where,
      include: {
        contact: { select: { id: true, fullName: true, phoneE164: true } }
      },
      orderBy: { startAt: "asc" },
      take: 200
    });

    const data = rows.map((r) =>
      ReservationPublic.parse({
        id: r.id,
        tenantId: r.tenantId,
        status: r.status,
        experienceType: r.experienceType,
        startAt: r.startAt.toISOString(),
        durationMinutes: r.durationMinutes,
        pax: r.pax,
        notes: r.notes,
        assignedTableIds: r.assignedTableIds,
        contact: r.contact
          ? { id: r.contact.id, fullName: r.contact.fullName, phoneE164: r.contact.phoneE164 }
          : null
      })
    );

    res.json({ data });
  }
);

// patch update
reservationsRouter.patch(
  "/:id",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "STAFF"]),
  requireCsrf,
  validateBody(PatchReservationInput),
  async (req, res) => {
    const id = req.params.id;
    const input = req.body as any;

    // STAFF: limited fields
    if (req.auth!.role === "STAFF") {
      const allowedKeys = new Set(["notes", "pax"]);
      for (const k of Object.keys(input)) {
        if (!allowedKeys.has(k)) {
          return res.status(403).json({ error: "FORBIDDEN_FIELD", field: k });
        }
      }
    }

    // enforce tenant isolation
    const existing = await prisma.reservation.findFirst({
      where: { id, tenantId: req.auth!.tenantId }
    });
    if (!existing) return res.status(404).json({ error: "NOT_FOUND" });

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        startAt: input.startAt ? new Date(input.startAt) : undefined,
        durationMinutes: input.durationMinutes,
        pax: input.pax,
        notes: input.notes,
        experienceType: input.experienceType,
        assignedTableIds: input.assignedTableIds,
        status: input.status
      },
      include: { contact: { select: { id: true, fullName: true, phoneE164: true } } }
    });

    await writeAuditLog({
      tenantId: req.auth!.tenantId,
      actorUserId: req.auth!.userId,
      action: "reservation.updated",
      entityType: "reservation",
      entityId: id,
      metadata: {
        changes: input
      }
    });

    // calendar sync (adapter isolated)
    await syncReservation(id);

    const out = ReservationPublic.parse({
      id: updated.id,
      tenantId: updated.tenantId,
      status: updated.status,
      experienceType: updated.experienceType,
      startAt: updated.startAt.toISOString(),
      durationMinutes: updated.durationMinutes,
      pax: updated.pax,
      notes: updated.notes,
      assignedTableIds: updated.assignedTableIds,
      contact: updated.contact
        ? { id: updated.contact.id, fullName: updated.contact.fullName, phoneE164: updated.contact.phoneE164 }
        : null
    });

    res.json({ data: out });
  }
);
