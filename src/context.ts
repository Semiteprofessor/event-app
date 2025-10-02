import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  user: { id: string; role: string } | null;
}

export const createContext = ({ req }: { req: any }): Context => {
  const authHeader = req.headers.authorization || "";
  let user = null;

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "123456") as any;
      user = { id: decoded.id, role: decoded.role }; // Keep only minimal info
    } catch (err: any) {
      // Don't throw here — just leave user as null
      console.warn("Invalid token:", err.message);
    }
  }

  return {
    prisma,
    user,
  };
};
