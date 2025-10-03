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

    getProductsBySubCategory: async (
      _parent: any,
      args: {
        slug: string;
        page?: number;
        limit?: number;
        brand?: string;
        sizes?: string;
        colors?: string;
        prices?: string;
        gender?: string;
        isFeatured?: boolean;
        date?: number;
        priceSort?: number;
        nameSort?: number;
        top?: number;
        rate?: number;
      }
    ) => {
      const {
        slug,
        page = 1,
        limit = 12,
        brand,
        sizes,
        colors,
        prices,
        gender,
        isFeatured,
        date,
        priceSort,
        nameSort,
        top,
        rate = 1,
      } = args;

      const subCategory = await prisma.subCategory.findUnique({
        where: { id: slug },
        select: { id: true },
      });

      if (!subCategory) throw new Error("SubCategory not found");

      let brandId: string | undefined;
      if (brand) {
        const brandRecord = await prisma.brand.findUnique({
          where: { slug: brand },
          select: { id: true },
        });
        brandId = brandRecord?.id;
      }

      const [minPrice, maxPrice] = prices
        ? prices.split("_").map((p) => Number(p) / rate)
        : [1, 1000000];

      const where: any = {
        subCategoryId: subCategory.id,
        status: { not: "disabled" },
        ...(brandId && { brandId }),
        ...(sizes && { sizes: { hasSome: sizes.split("_") } }),
        ...(colors && { colors: { hasSome: colors.split("_") } }),
        ...(gender && { gender: { in: gender.split("_") } }),
        ...(isFeatured && { isFeatured: true }),
        priceSale: { gt: minPrice, lt: maxPrice },
      };

      const totalProducts = await prisma.product.count({ where });

      let orderBy: any = { createdAt: "desc" };
      if (date) orderBy = { createdAt: date === 1 ? "asc" : "desc" };
      else if (priceSort)
        orderBy = { priceSale: priceSort === 1 ? "asc" : "desc" };
      else if (nameSort) orderBy = { name: nameSort === 1 ? "asc" : "desc" };
      else if (top) orderBy = { likes: top === 1 ? "asc" : "desc" };

      const products = await prisma.product.findMany({
        where,
        include: {
          reviews: true,
          shop: true,
          brand: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      const productsWithRatings = products.map((p) => {
        const avg =
          p.reviews.length > 0
            ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length
            : 0;
        return { ...p, averageRating: avg };
      });

      return {
        data: productsWithRatings,
        total: totalProducts,
        count: Math.ceil(totalProducts / limit),
      };
    },

    productsByShop: async (
      _: any,
      args: {
        shopSlug: string;
        page?: number;
        limit?: number;
        prices?: string;
        sizes?: string;
        colors?: string;
        name?: number;
        date?: number;
        price?: number;
        top?: number;
        brand?: string;
        rate?: number;
        gender?: string;
        isFeatured?: boolean;
      }
    ) => {
      try {
        const {
          shopSlug,
          page = 1,
          limit = 12,
          prices,
          sizes,
          colors,
          brand,
          rate = 1,
          gender,
          isFeatured,
          name,
          date,
          price,
          top,
        } = args;

        const shop = await prisma.shop.findUnique({
          where: { slug: shopSlug },
        });
        if (!shop) throw new GraphQLError("Shop not found");

        let brandRecord = null;
        if (brand) {
          brandRecord = await prisma.brand.findUnique({
            where: { slug: brand },
          });
        }

        const minPrice = prices ? Number(prices.split("_")[0]) / rate : 1;
        const maxPrice = prices
          ? Number(prices.split("_")[1]) / rate
          : 10000000;

        const whereClause: any = {
          shopId: shop.id,
          status: { not: "disabled" },
        };

        if (brandRecord) whereClause.brandId = brandRecord.id;
        if (sizes) whereClause.sizes = { hasSome: sizes.split("_") };
        if (colors) whereClause.colors = { hasSome: colors.split("_") };
        if (gender) whereClause.gender = { in: gender.split("_") };
        if (isFeatured !== undefined) whereClause.isFeatured = isFeatured;
        if (prices) whereClause.priceSale = { gt: minPrice, lt: maxPrice };

        let orderBy: any = { averageRating: "desc" };
        if (date) orderBy = { createdAt: date === 1 ? "asc" : "desc" };
        if (price) orderBy = { priceSale: price === 1 ? "asc" : "desc" };
        if (name) orderBy = { name: name === 1 ? "asc" : "desc" };
        if (top) orderBy = { averageRating: top === 1 ? "asc" : "desc" };

        const total = await prisma.product.count({
          where: whereClause,
        });

        const products = await prisma.product.findMany({
          where: whereClause,
          include: {
            shop: true,
            reviews: true,
            images: true,
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        });

        const result = products.map((p) => {
          const averageRating =
            p.reviews.length > 0
              ? p.reviews.reduce((acc, r) => acc + r.rating, 0) /
                p.reviews.length
              : 0;

          return {
            ...p,
            averageRating,
            image: p.images?.[0] || null,
          };
        });

        return {
          data: result,
          total,
          count: Math.ceil(total / limit),
        };
      } catch (error: any) {
        throw new GraphQLError(error.message || "Failed to fetch products");
      }
    },
  },
};
