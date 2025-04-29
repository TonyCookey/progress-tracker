import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedBases() {
  // --- Create Bases ---
  await prisma.base.create({ data: { name: "Alpha" } });
  await prisma.base.create({ data: { name: "Bravo" } });

  console.log("✅ Bases seeded successfully");
}

seedBases()
  .catch((e) => {
    console.error("❌ Error seeding bases:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
