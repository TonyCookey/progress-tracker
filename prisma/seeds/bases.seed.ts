import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedBases() {
  // --- Create Bases ---

  await prisma.base.create({ data: { name: "Alpha", label: "Mainland" } });
  await prisma.base.create({ data: { name: "Bravo", label: "Island" } });

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
