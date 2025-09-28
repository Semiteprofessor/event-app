import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { signJwt } from "../../lib/jwt.js";

export default function AuthService({ prisma }: { prisma: PrismaClient }) {
  return {
    async signup({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name?: string;
    }) {
      const hash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { email, passwordHash: hash, name },
      });
      const accessToken = signJwt({ sub: user.id, role: user.role });
      
      const refreshToken = "...";
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      return { accessToken, refreshToken, user };
    },

    async login({ email, password }: { email: string; password: string }) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("Invalid credentials");
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new Error("Invalid credentials");
      const accessToken = signJwt({ sub: user.id, role: user.role });
      return { accessToken, refreshToken: "...", user };
    },
  };
}
