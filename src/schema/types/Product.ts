const {
  objectType,
  inputObjectType,
  mutationField,
  nonNull,
  list,
} = require("nexus");
const { esClient } = require("../../lib/elasticsearch");

const Product = objectType({
  name: "Product",
  definition(t: import("nexus/dist/core").ObjectDefinitionBlock<"Product">) {
    t.nonNull.string("id");
    t.string("name");
    t.string("code");
    t.string("status");
    t.boolean("isFeatured");
    t.string("brandId");
    t.field("brand", { type: "Brand" });
    t.int("likes");
    t.string("description");
    t.string("metaTitle");
    t.string("metaDescription");
    t.nonNull.string("slug");
    t.nonNull.string("categoryId");
    t.field("category", { type: "Category" });
    t.nonNull.string("subCategoryId");
    t.field("subCategory", { type: "SubCategory" });
    t.string("gender");
    t.list.string("tags");
    t.nonNull.string("sku");
    t.nonNull.float("price");
    t.nonNull.float("priceSale");
    t.float("oldPriceSale");
    t.nonNull.int("available");
    t.int("sold");
    t.nonNull.string("shopId");
    t.field("shop", { type: "Shop" });
    t.list.field("reviews", { type: "ProductReview" });
    t.list.field("images", { type: "ProductImage" });
    t.list.string("colors");
    t.list.string("sizes");

    t.nonNull.string("createdAt");
    t.nonNull.string("updatedAt");
  },
});

const ProductInput = inputObjectType({
  name: "ProductInput",
  definition(t: import("nexus/dist/core").InputDefinitionBlock<"ProductInput">) {
    t.nonNull.string("name");
    t.nonNull.string("slug");
    t.string("code");
    t.string("status");
    t.boolean("isFeatured");
    t.string("brandId");
    t.string("description");
    t.string("metaTitle");
    t.string("metaDescription");
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

const createProduct = mutationField("createProduct", {
  type: "Product",
  args: {
    data: nonNull("ProductInput"),
  },
  resolve: async (_, { data }, ctx) => {
    const product = await ctx.prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        code: data.code,
        status: data.status,
        isFeatured: data.isFeatured,
        brandId: data.brandId,
        description: data.description,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId,
        gender: data.gender,
        tags: data.tags,
        sku: data.sku,
        price: data.price,
        priceSale: data.priceSale,
        oldPriceSale: data.oldPriceSale,
        available: data.available,
        shopId: data.shopId,
        colors: data.colors,
        sizes: data.sizes,
      },
      include: {
        brand: true,
        category: true,
        subCategory: true,
        shop: true,
        reviews: true,
        images: true,
      },
    });

    await esClient.index({
      index: "products",
      id: product.id,
      document: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        priceSale: product.priceSale,
        categoryId: product.categoryId,
        subCategoryId: product.subCategoryId,
        shopId: product.shopId,
      },
    });

    return product;
  },
});

module.exports = {
  Product,
  ProductInput,
  createProduct,
};
