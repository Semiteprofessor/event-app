import { IResolvers } from "@graphql-tools/utils";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

import { getUserFromToken } from "../../lib/jwt.js";
import { GraphQLError } from "graphql";

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
  
  const user = await getUser(context.req, context.res);
  if (!user) {
    throw new Error("Unauthorized");
  }

  const pageNumber = Math.max(page, 1);
  const pageSize = Math.max(limit, 1);
  const skip = (pageNumber - 1) * pageSize;

  const totalOrderCount = await prisma.order.count({
    where: {
      userId: user.id,
    },
  });

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
    },
    skip,
    take: pageSize,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      
      items: true,
      shop: true,
    },
  });

  return {
    orders,
    count: Math.ceil(totalOrderCount / pageSize),
  };
},


  Mutation: {
    updateUser: async (_parent, { data }, context) => {
      const user = await getUser(context.req, context.res);
      const updatedUser = await User.findByIdAndUpdate(user._id, data, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!updatedUser) throw new Error("User Not Found");
      return updatedUser;
    },

    changePassword: async (
      _parent,
      { password, newPassword, confirmPassword },
      context
    ) => {
      const user = await getUser(context.req, context.res);
      const existingUser = await User.findById(user._id).select("password");
      if (!existingUser) throw new Error("User Not Found");

      const passwordMatch = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (!passwordMatch) throw new Error("Old Password Incorrect");

      if (newPassword !== confirmPassword)
        throw new Error("New Password Mismatch");
      if (password === newPassword)
        throw new Error("Please enter a new password");

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(user._id, { password: hashedNewPassword });

      return "Password Changed Successfully";
    },
  },
};
