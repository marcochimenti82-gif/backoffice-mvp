-- This migration is intentionally minimal and mirrors prisma/schema.prisma for a fresh DB.
-- If you are pointing Prisma to an existing core DB that already has these tables, DO NOT run this migration.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('ADMIN','MANAGER','STAFF','ACCOUNTING');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReservationStatus') THEN
    CREATE TYPE "ReservationStatus" AS ENUM ('PENDING','CONFIRMED','CANCELLED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Rome',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "phoneE164" TEXT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "role" "Role" NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "refreshTokenVersion" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User" ("tenantId");

CREATE TABLE IF NOT EXISTS "Contact" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "fullName" TEXT NOT NULL,
  "phoneE164" TEXT NULL,
  "email" TEXT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Contact_tenantId_idx" ON "Contact" ("tenantId");
CREATE INDEX IF NOT EXISTS "Contact_phoneE164_idx" ON "Contact" ("phoneE164");

CREATE TABLE IF NOT EXISTS "Reservation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "contactId" UUID NULL REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
  "experienceType" TEXT NULL,
  "startAt" TIMESTAMPTZ NOT NULL,
  "durationMinutes" INTEGER NOT NULL DEFAULT 90,
  "pax" INTEGER NOT NULL DEFAULT 2,
  "notes" TEXT NULL,
  "assignedTableIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "calendarEventId" TEXT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Reservation_tenantId_startAt_idx" ON "Reservation" ("tenantId","startAt");
CREATE INDEX IF NOT EXISTS "Reservation_tenantId_status_idx" ON "Reservation" ("tenantId","status");

CREATE TABLE IF NOT EXISTS "Table" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "capacityMin" INTEGER NOT NULL DEFAULT 1,
  "capacityMax" INTEGER NOT NULL DEFAULT 4,
  "area" TEXT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Table_tenantId_idx" ON "Table" ("tenantId");

CREATE TABLE IF NOT EXISTS "TableUnion" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "tableIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "capacityMax" INTEGER NOT NULL DEFAULT 0,
  "rules" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TableUnion_tenantId_idx" ON "TableUnion" ("tenantId");

CREATE TABLE IF NOT EXISTS "Document" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "driveFileId" TEXT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "note" TEXT NULL,
  "linkedEntityType" TEXT NULL,
  "linkedEntityId" TEXT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "Document_tenantId_idx" ON "Document" ("tenantId");
CREATE INDEX IF NOT EXISTS "Document_linked_idx" ON "Document" ("linkedEntityType","linkedEntityId");

CREATE TABLE IF NOT EXISTS "LedgerEntry" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "center" TEXT NOT NULL DEFAULT 'main',
  "type" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "method" TEXT NULL,
  "category" TEXT NULL,
  "description" TEXT NULL,
  "occurredOn" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "LedgerEntry_tenantId_occurredOn_idx" ON "LedgerEntry" ("tenantId","occurredOn");
CREATE INDEX IF NOT EXISTS "LedgerEntry_tenantId_center_idx" ON "LedgerEntry" ("tenantId","center");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "actorUserId" UUID NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog" ("tenantId","createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_action_idx" ON "AuditLog" ("tenantId","action");
CREATE INDEX IF NOT EXISTS "AuditLog_tenant_entity_idx" ON "AuditLog" ("tenantId","entityType","entityId");
