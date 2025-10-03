import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const productResolvers = {
  Query: {
    getProducts: async (_: any, { filter }: any) => {
      try {
        const {
          page = 1,
          limit = 12,
          brand,
          sizes,
          colors,
          prices,
          date,
          price,
          name,
          top,
          gender,
          isFeatured,
          rate = 1,
        } = filter || {};

        const skip = (page - 1) * limit;
        const take = limit;

        const minPrice = prices ? Number(prices.split("_")[0]) / rate : 1;
        const maxPrice = prices ? Number(prices.split("_")[1]) / rate : 1000000;

        const where: any = {
          status: { not: "disabled" },
          ...(brand && {
            brand: { slug: brand },
          }),
          ...(gender && {
            gender: { in: gender.split("_") },
          }),
          ...(sizes && {
            sizes: { hasSome: sizes.split("_") },
          }),
          ...(colors && {
            colors: { hasSome: colors.split("_") },
          }),
          priceSale: { gt: minPrice, lt: maxPrice },
          ...(isFeatured && { isFeatured }),
        };

        let orderBy: any = { averageRating: "desc" };
        if (date) orderBy = { createdAt: date === 1 ? "asc" : "desc" };
        else if (price) orderBy = { priceSale: price === 1 ? "asc" : "desc" };
        else if (name) orderBy = { name: name === 1 ? "asc" : "desc" };
        else if (top) orderBy = { averageRating: top === 1 ? "asc" : "desc" };

        const total = await prisma.product.count({ where });

        const products = await prisma.product.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            reviews: { select: { rating: true } },
            brand: { select: { slug: true } },
            images: true,
          },
        });

        const formattedProducts = products.map((p) => {
          const avgRating =
            p.reviews.length > 0
              ? p.reviews.reduce((acc, r) => acc + r.rating, 0) /
                p.reviews.length
              : 0;

          return {
            ...p,
            averageRating: avgRating,
            image: p.images?.[0] || null,
          };
        });

        return {
          success: true,
          data: formattedProducts,
          total,
          count: Math.ceil(total / limit),
        };
      } catch (error: any) {
        console.error(error);
        throw new Error("Failed to fetch products: " + error.message);
      }
    },
  },
};
