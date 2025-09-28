import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { verifyJwt } from "./lib/jwt.js";

const prisma = new PrismaClient();

export type Context = {
  prisma: PrismaClient;
  req: Request;
  user?: { id: string; role: string } | null;
  services: {
    auth: ReturnType<typeof import("./modules/auth/auth.service.js").default>;
    event: ReturnType<typeof import("./modules/event/event.service.js").default>;
  };
};

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  const authHeader = req.headers.authorization || "";
  let user = null;
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const payload = verifyJwt(token);
      user = { id: payload.sub, role: payload.role };
    } catch (err) {
      user = null;
    }
  }

  const services = {
    auth: (await import("./modules/auth/auth.service.js")).default({ prisma }),
    event: (await import("./modules/event/event.service.js")).default({ prisma }),
  };

  return { prisma, req, user, services };
}
