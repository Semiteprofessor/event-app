import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";
const prisma = new PrismaClient();

interface GetProductsArgs {
  categorySlug: string;
  brandSlug?: string;
  page?: number;
  limit?: number;
  prices?: string;
  sizes?: string[];
  colors?: string[];
  gender?: string[];
  date?: number;
  price?: number;
  name?: number;
  top?: number;
  isFeatured?: boolean;
  rate?: number;
}

interface GetProductsByCompaignArgs {
  slug: string;
  page?: number;
  limit?: number;
  name?: number;
  date?: number;
  price?: number;
  top?: number;
  rate?: number;
}
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

    getProductsByCategory: async (
      _parent: any,
      args: {
        categorySlug: string;
        brandSlug?: string;
        sizes?: string[];
        colors?: string[];
        minPrice?: number;
        maxPrice?: number;
        isFeatured?: boolean;
        gender?: string[];
        sortBy?: string;
        sortOrder?: number;
        page?: number;
        limit?: number;
      }
    ) => {
      const {
        categorySlug,
        brandSlug,
        sizes,
        colors,
        minPrice = 1,
        maxPrice = 1000000,
        isFeatured,
        gender,
        sortBy = "averageRating",
        sortOrder = -1,
        page = 1,
        limit = 12,
      } = args;

      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (!category) throw new Error("Category not found");

      let brandId: string | undefined;
      if (brandSlug) {
        const brand = await prisma.brand.findUnique({
          where: { slug: brandSlug },
        });
        if (!brand) throw new Error("Brand not found");
        brandId = brand.id;
      }

      const skip = (page - 1) * limit;

      const where: any = {
        categoryId: category.id,
        status: { not: "disabled" },
        priceSale: {
          gte: minPrice,
          lte: maxPrice,
        },
      };

      if (brandId) where.brandId = brandId;
      if (sizes && sizes.length > 0) where.sizes = { hasSome: sizes };
      if (colors && colors.length > 0) where.colors = { hasSome: colors };
      if (gender && gender.length > 0) where.gender = { in: gender };
      if (isFeatured !== undefined) where.isFeatured = isFeatured;

      const totalProducts = await prisma.product.count({ where });

      const products = await prisma.product.findMany({
        where,
        include: {
          shop: true,
          brand: true,
          category: true,
          reviews: true,
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder === -1 ? "desc" : "asc",
        },
      });

      const productsWithRatings = products.map((p) => {
        const avgRating =
          p.reviews.length > 0
            ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length
            : 0;

        return {
          ...p,
          averageRating: avgRating,
        };
      });

      return {
        products: productsWithRatings,
        total: totalProducts,
        count: Math.ceil(totalProducts / limit),
      };
    },

    getProductsByCompaign: async (_: any, args: GetProductsByCompaignArgs) => {
      try {
        const {
          slug,
          page = 1,
          limit = 12,
          name,
          date,
          price,
          top,
          rate = 1,
        } = args;

        // ✅ 1. Find the campaign by slug
        const compaign = await prisma.compaign.findUnique({
          where: { slug },
          include: {
            products: {
              include: { product: { include: { reviews: true } } },
            },
          },
        });

        if (!compaign) {
          throw new GraphQLError("Compaign not found");
        }

        const productIds = compaign.products.map((p) => p.productId);

        if (productIds.length === 0) {
          return {
            success: true,
            data: [],
            total: 0,
            count: 0,
          };
        }

        const totalProducts = await prisma.product.count({
          where: {
            id: { in: productIds },
            status: { not: "disabled" },
          },
        });

        const orderBy: any = (date && { createdAt: date }) ||
          (price && { priceSale: price }) ||
          (name && { name: name }) ||
          (top && { reviews: { _avg: { rating: top } } }) || {
            reviews: { _avg: { rating: "desc" } },
          };

        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds },
            status: { not: "disabled" },
          },
          include: {
            reviews: true,
            shop: true,
          },
          orderBy,
          skip: limit * (page - 1),
          take: limit,
        });

        const productsWithRating = products.map((p) => ({
          ...p,
          averageRating:
            p.reviews.length > 0
              ? p.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
                p.reviews.length
              : 0,
        }));

        return {
          success: true,
          data: productsWithRating,
          total: totalProducts,
          count: Math.ceil(totalProducts / limit),
        };
      } catch (error: any) {
        console.error("getProductsByCompaign error:", error);
        throw new GraphQLError(error.message || "Internal server error");
      }
    },
  },
};
