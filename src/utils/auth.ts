import { Context } from "../context.js";

export function requireAuth(ctx: Context) {
  if (!ctx.user) {
    throw new Error("❌ You must be logged in to access this resource.");
  }
}

export async function requireVerifiedUser(ctx: Context) {
  requireAuth(ctx);

  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.user?.id },
  });

  if (!user) throw new Error("❌ User not found.");
  if (!user.isVerified) throw new Error("❌ Email is not verified.");

  return user;
}

export async function requireAdmin(ctx: Context) {
  requireAuth(ctx);

  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.user?.id },
  });

  if (!user) throw new Error("❌ User not found.");
  if (!user.role.includes("admin"))
    throw new Error("❌ Access denied. Admin only.");

  return user;
}

export async function requireVendor(ctx: Context) {
  requireAuth(ctx);

  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.user?.id },
  });

  if (!user) throw new Error("❌ User not found.");
  if (!user.role.includes("vendor"))
    throw new Error("❌ Access denied. Vendor only.");

  return user;
}
