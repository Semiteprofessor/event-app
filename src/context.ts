import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { verifyJwt } from "./lib/jwt.js";

const prisma = new PrismaClient();

type AuthService = ReturnType<
  typeof import("./modules/auth/auth.service.js").default
>;
type EventService = ReturnType<
  typeof import("./modules/event/event.service.js").default
>;

export type Context = {
  prisma: PrismaClient;
  req: Request;
  user?: { id: string; role: string } | null;
  services: {
    auth: AuthService;
    event: EventService;
  };
};

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  // 🔐 Extract user from JWT
  const authHeader = req.headers.authorization || "";
  let user: { id: string; role: string } | null = null;

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const payload = verifyJwt(token);
      user = { id: payload.sub, role: payload.role };
    } catch {
      user = null;
    }
  }

  const authServiceModule = await import("./modules/auth/auth.service.js");
  const eventServiceModule = await import("./modules/event/event.service.js");

  const services = {
    auth: authServiceModule.default({ prisma }),
    event: eventServiceModule.default({ prisma }),
  };

  return {
    prisma,
    req,
    user,
    services,
  };
}
