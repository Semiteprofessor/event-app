import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "semiteprofessor@gmail.com" },
    update: {},
    create: {
      email: "semiteprofessor@gmail.com",
      passwordHash: "12345678",
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log({ admin });
}

main().finally(() => prisma.$disconnect());
