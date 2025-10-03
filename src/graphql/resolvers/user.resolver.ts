import { IResolvers } from "@graphql-tools/utils";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

import { getUserFromToken } from "../../lib/jwt.js";
import { GraphQLError } from "graphql";
import { getUser } from "../../utils/getUser.js";

const prisma = new PrismaClient();

interface Context {
  user?: { id: string; email: string };
}

getUserFromToken;

export const userResolvers: IResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: context.user.id },
      });
      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return user;
    },

    userByAdmin: async (
      _parent: unknown,
      {
        id,
        page = 1,
        limit = 10,
      }: { id: string; page?: number; limit?: number },
      _context
    ) => {
      const pageNumber = Math.max(page, 1);
      const pageSize = Math.max(limit, 1);
      const skip = (pageNumber - 1) * pageSize;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const totalOrders = await prisma.order.count({
        where: { userId: id },
      });

      const orders = await prisma.order.findMany({
        where: { userId: id },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        orders,
        count: Math.ceil(totalOrders / pageSize),
      };
    },

    invoice: async (
      _parent: unknown,
      { page = 1, limit = 10 }: { page?: number; limit?: number },
      context: any
    ) => {
      const user = await getUser(context, true);

      const pageNumber = Math.max(page, 1);
      const pageSize = Math.max(limit, 1);
      const skip = (pageNumber - 1) * pageSize;

      const totalOrderCount = await prisma.order.count({
        where: { userId: user.id },
      });

      const orders = await prisma.order.findMany({
        where: { userId: user.id },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          shop: true,
        },
      });

      return {
        success: true,
        orders,
        count: Math.ceil(totalOrderCount / pageSize),
      };
    },
  },

  Mutation: {
    updateUser: async (_parent: any, { input }: any, context: any) => {
      if (!context.user?.id) {
        throw new GraphQLError("You must be logged in.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: context.user.id },
      });

      if (!existingUser) {
        throw new GraphQLError("User not found.", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: context.user.id },
        data: {
          ...input,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          gender: true,
          phone: true,
          address: true,
          city: true,
          zip: true,
          country: true,
          state: true,
          about: true,
          coverUrl: true,
          coverId: true,
          coverBlurDataURL: true,
          isVerified: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    },
  },
};
