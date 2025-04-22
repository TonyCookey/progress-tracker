import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // --- Create Bases ---
  const alpha = await prisma.base.create({ data: { name: "Alpha" } });
  const bravo = await prisma.base.create({ data: { name: "Bravo" } });

  // --- Create Users ---
  const password = await bcrypt.hash("password123", 10);

  const generalRuth = await prisma.user.create({
    data: {
      name: "General Ruth",
      email: "gr@davidsarmy.com.ng",
      username: "GR",
      password,
      dateOfBirth: new Date("1994-01-26"),
      role: "SUPERADMIN",
      baseId: bravo.id,
    },
  });

  const colonelTony = await prisma.user.create({
    data: {
      name: "Colonel Tony",
      email: "ct@davidsarmy.com.ng",
      username: "CT",
      password,
      dateOfBirth: new Date("1997-12-27"),
      role: "SUPERADMIN",
      baseId: bravo.id,
    },
  });

  //   await prisma.user.create({
  //     data: {
  //       name: "Volunteer Semira",
  //       email: "semira@davidsarmy.com.ng",
  //       username: "SM",
  //       password,
  //       dateOfBirth: new Date("1990-04-23"),
  //       role: "VOLUNTEER",
  //       baseId: bravo.id,
  //     },
  //   });

  // --- Create Teens ---
  //   const teen1 = await prisma.teen.create({
  //     data: {
  //       name: "Lieutenant Favour",
  //       dateOfBirth: new Date("2009-07-20"),
  //       baseId: alpha.id,
  //     },
  //   });

  //   await prisma.teen.create({
  //     data: {
  //       name: "Lieutenant Temisan",
  //       dateOfBirth: new Date("2010-01-15"),
  //       baseId: bravo.id,
  //     },
  //   });

  // --- Create Groups (Platoon and Squad) ---
  //   await prisma.group.create({
  //     data: {
  //       name: "GG Nation (Female 13–15)",
  //       type: "PLATOON",
  //       baseId: bravo.id,
  //       leaderId: generalRuth.id,
  //       //   teens: {
  //       //     set: [teen1.id],
  //       //   },
  //     },
  //   });

  //   await prisma.group.create({
  //     data: {
  //       name: "BEYOND",
  //       type: "SQUAD",
  //       baseId: bravo.id,
  //       leaderId: colonelTony.id,
  //       //   teens: {
  //       //     set: [teen1.id], // add Lara
  //       //   },
  //     },
  //   });

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
