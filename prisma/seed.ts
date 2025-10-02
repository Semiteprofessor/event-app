import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "semiteprofessor@gmail.com" },
    update: {},
    create: {
      email: "semiteprofessor@gmail.com",
      password: "12345678",
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
      phone: "0000000000",
    },
  });

  console.log("✅ Admin user created:", admin);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
