import { objectType, inputObjectType, mutationField, queryField, nonNull, list, intArg, stringArg, floatArg } from "nexus";
import { Context } from "../context.js";
import { esClient } from "../lib/elasticsearch.js";


/* ================================
   Product Object Type
=============================== */
export const Product = objectType({
  name: "Product",
  definition(t) {
    t.nonNull.string("id");
    t.string("name");
    t.string("code");
    t.string("status");
    t.boolean("isFeatured");
    t.int("likes");
    t.string("description");
    t.string("metaTitle");
    t.string("metaDescription");
    t.string("slug");
    t.string("brandId");
    t.string("categoryId");
    t.string("subCategoryId");
    t.string("gender");
    t.list.string("tags");
    t.string("sku");
    t.float("price");
    t.float("priceSale");
    t.float("oldPriceSale");
    t.int("available");
    t.int("sold");
    t.string("shopId");
    t.list.string("colors");
    t.list.string("sizes");
    t.string("createdAt");
    t.string("updatedAt");
  },
});

/* ================================
   Product Input Type
=============================== */
export const ProductInput = inputObjectType({
  name: "ProductInput",
  definition(t) {
    t.nonNull.string("name");
    t.string("code");
    t.string("status");
    t.boolean("isFeatured");
    t.string("brandId");
    t.string("description");
    t.string("metaTitle");
    t.string("metaDescription");
    t.nonNull.string("slug");
    t.nonNull.string("categoryId");
    t.nonNull.string("subCategoryId");
    t.string("gender");
    t.list.string("tags");
    t.nonNull.string("sku");
    t.nonNull.float("price");
    t.nonNull.float("priceSale");
    t.float("oldPriceSale");
    t.nonNull.int("available");
    t.string("shopId");
    t.list.string("colors");
    t.list.string("sizes");
  },
});

/* =======================================================
   ✅ Mutation: createProduct (Production-ready style)
======================================================= */
export const createProduct = mutationField("createProduct", {
  type: "Product",
  args: {
    data: nonNull("ProductInput"),
  },
  resolve: async (_, { data }, ctx: Context) => {
    try {
      // 🔒 Authentication check
      if (!ctx.user) {
        throw new Error("You must be logged in to create a product.");
      }

      // 🛠️ Basic validation
      if (!data.name || !data.sku) {
        throw new Error("Product name and SKU are required.");
      }

      // 💾 Create product
      const product = await ctx.prisma.product.create({
        data: {
          name: data.name,
          code: data.code,
          status: data.status ?? "draft",
          isFeatured: data.isFeatured ?? false,
          brandId: data.brandId,
          description: data.description,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          slug: data.slug,
          categoryId: data.categoryId,
          subCategoryId: data.subCategoryId,
          gender: data.gender,
          tags: data.tags ?? [],
          sku: data.sku,
          price: data.price,
          priceSale: data.priceSale,
          oldPriceSale: data.oldPriceSale,
          available: data.available,
          shopId: data.shopId,
          colors: data.colors ?? [],
          sizes: data.sizes ?? [],
        },
      });

      // 🔍 Index in Elasticsearch for search
      await esClient.index({
        index: "products",
        id: product.id,
        document: {
          name: product.name,
          description: product.description,
          price: product.price,
          slug: product.slug,
          categoryId: product.categoryId,
        },
      });

      return product;
    } catch (error: any) {
      console.error("❌ createProduct error:", error.message);
      throw new Error(`Failed to create product: ${error.message}`);
    }
  },
});

/* =======================================================
   ✅ Query: getProducts (Search, Pagination, Filters)
======================================================= */
export const getProducts = queryField("getProducts", {
  type: list("Product"),
  args: {
    search: stringArg(),
    page: intArg({ default: 1 }),
    limit: intArg({ default: 10 }),
    categoryId: stringArg(),
  },
  resolve: async (_, args, ctx: Context) => {
    try {
      const { search, page, limit, categoryId } = args;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const products = await ctx.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      return products;
    } catch (error: any) {
      console.error("❌ getProducts error:", error.message);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  },
});
