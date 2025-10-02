import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";

const prisma = new PrismaClient();

export const getUser = async (
  context: any,
  requireVerified: boolean = false
) => {
  if (!context.user || !context.user.id) {
    throw new GraphQLError("You must be logged in.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
  });

  if (!user) {
    throw new GraphQLError("User not found.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (requireVerified && !user.isVerified) {
    throw new GraphQLError("User email is not verified.", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return user;
};

