import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureTenant(slug: string, name: string) {
  const existing = await prisma.tenant.findFirst({ where: { slug } });
  if (existing) return existing;

  return prisma.tenant.create({
    data: { slug, name },
  });
}

async function main() {
  // Tenant fissi (no env, no undefined)
  const pescheto = await ensureTenant("pescheto", "Pescheto Tenuta Chimenti");
  const tuttibrilli = await ensureTenant("tuttibrilli", "TuttiBrilli Enoteca");

  // Admin di default
  const email = "admin@pescheto.local";
  const plainPassword = "ChangeMe123!";
  const passwordHash = bcrypt.hashSync(plainPassword, 10);

  // Upsert su email (email deve essere unique nello schema)
  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      tenantId: pescheto.id,
      name: "Admin Pescheto",
    },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      tenantId: pescheto.id,
      name: "Admin Pescheto",
    },
  });

  // (Opzionale) un admin anche per Tuttibrilli, se vuoi già pronto:
  const emailTb = "admin@tuttibrilli.local";
  await prisma.user.upsert({
    where: { email: emailTb },
    update: {
      passwordHash,
      role: "ADMIN",
      tenantId: tuttibrilli.id,
      name: "Admin Tuttibrilli",
    },
    create: {
      email: emailTb,
      passwordHash,
      role: "ADMIN",
      tenantId: tuttibrilli.id,
      name: "Admin Tuttibrilli",
    },
  });

  console.log("✅ Seed completato:");
  console.log(`- Tenant: ${pescheto.slug}, ${tuttibrilli.slug}`);
  console.log(`- Admin: ${email} / ${plainPassword}`);
  console.log(`- Admin: ${emailTb} / ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
