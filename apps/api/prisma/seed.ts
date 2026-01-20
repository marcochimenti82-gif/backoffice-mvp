import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureTenantByName(name: string) {
  const existing = await prisma.tenant.findFirst({
    where: { name },
  });

  if (existing) return existing;

  // Se "timezone" nel tuo schema NON esiste, elimina la riga timezone.
  return prisma.tenant.create({
    data: {
      name,
      timezone: "Europe/Rome",
    } as any,
  });
}

async function main() {
  // Tenant (qui usiamo SOLO name, perché slug non esiste nel tuo schema)
  const pescheto = await ensureTenantByName("Pescheto Tenuta Chimenti");
  const tuttibrilli = await ensureTenantByName("TuttiBrilli Enoteca");

  // Admin default
  const passwordPlain = "ChangeMe123!";
  const passwordHash = bcrypt.hashSync(passwordPlain, 10);

  // Admin Pescheto
  await prisma.user.upsert({
    where: { email: "admin@pescheto.local" },
    update: {
      passwordHash,
      role: "ADMIN",
      tenantId: pescheto.id,
      name: "Admin Pescheto",
    },
    create: {
      email: "admin@pescheto.local",
      passwordHash,
      role: "ADMIN",
      tenantId: pescheto.id,
      name: "Admin Pescheto",
    },
  });

  // (Opzionale) Admin Tuttibrilli
  await prisma.user.upsert({
    where: { email: "admin@tuttibrilli.local" },
    update: {
      passwordHash,
      role: "ADMIN",
      tenantId: tuttibrilli.id,
      name: "Admin Tuttibrilli",
    },
    create: {
      email: "admin@tuttibrilli.local",
      passwordHash,
      role: "ADMIN",
      tenantId: tuttibrilli.id,
      name: "Admin Tuttibrilli",
    },
  });

  console.log("✅ Seed OK");
  console.log("- admin@pescheto.local / ChangeMe123!");
  console.log("- admin@tuttibrilli.local / ChangeMe123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
