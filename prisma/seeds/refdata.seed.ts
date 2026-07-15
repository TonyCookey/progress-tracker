import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const activityTypes = ["Outreach", "Worship", "Sunday Service", "Bible Study", "Hangouts", "Rehearsals", "Other"];

const offeringTypes = [
  { key: "Cash", label: "Cash" },
  { key: "Online", label: "Transfer" },
];

const defaultReportSections = {
  theme: true,
  executiveSummary: true,
  issues: true,
  alternativeChurches: true,
  sundayTeaching: true,
  description: true,
  victories: true,
  challenges: true,
  plans: true,
  updateOnTeens: true,
};

async function seedRefData() {
  await Promise.all(
    activityTypes.map((key, i) =>
      prisma.refData.upsert({
        where: { category_key: { category: "activity_type", key } },
        update: {},
        create: { category: "activity_type", key, label: key, sortOrder: i },
      }),
    ),
  );

  await Promise.all(
    offeringTypes.map(({ key, label }, i) =>
      prisma.refData.upsert({
        where: { category_key: { category: "offering_type", key } },
        update: {},
        create: { category: "offering_type", key, label, sortOrder: i },
      }),
    ),
  );

  await prisma.reportTemplateConfig.upsert({
    where: { key: "default" },
    update: {},
    create: { key: "default", sectionsJson: defaultReportSections },
  });

  console.log("✅ RefData + ReportTemplateConfig seeded successfully");
}

seedRefData()
  .catch((e) => {
    console.error("❌ Error seeding reference data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
