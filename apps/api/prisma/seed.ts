import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("ChangeMe123!");

  const tuttibrilli = await prisma.tenant.upsert({
    where: { name: "Tuttibrilli Enoteca" },
    update: {},
    create: { name: "Tuttibrilli Enoteca", timezone: "Europe/Rome" }
  });

  const pescheto = await prisma.tenant.upsert({
    where: { name: "Pescheto Tenuta Chimenti" },
    update: {},
    create: { name: "Pescheto Tenuta Chimenti", timezone: "Europe/Rome" }
  });

  await prisma.user.upsert({
    where: { email: "admin@tuttibrilli.local" },
    update: { tenantId: tuttibrilli.id, passwordHash, role: Role.ADMIN, isActive: true },
    create: {
      tenantId: tuttibrilli.id,
      name: "Admin Tuttibrilli",
      email: "admin@tuttibrilli.local",
      role: Role.ADMIN,
      passwordHash,
      isActive: true
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@pescheto.local" },
    update: { tenantId: pescheto.id, passwordHash, role: Role.ADMIN, isActive: true },
    create: {
      tenantId: pescheto.id,
      name: "Admin Pescheto",
      email: "admin@pescheto.local",
      role: Role.ADMIN,
      passwordHash,
      isActive: true
    }
  });

  // minimal contacts/reservations demo
  const c1 = await prisma.contact.create({
    data: {
      tenantId: pescheto.id,
      fullName: "Mario Rossi",
      phoneE164: "+393331112233"
    }
  });

  await prisma.reservation.create({
    data: {
      tenantId: pescheto.id,
      contactId: c1.id,
      status: "CONFIRMED",
      experienceType: "Piscina + pranzo",
      startAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      durationMinutes: 180,
      pax: 4,
      notes: "Allergia: frutta secca",
      assignedTableIds: []
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
