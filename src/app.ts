const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { createContext } = require("./context");
const { productResolvers } = require("./graphql/resolvers/product.resolver");
const path = require("path");
const fs = require("fs");

const typeDefs = fs.readFileSync(
  path.join(__dirname, "./graphql/schema/product.graphql"),
  "utf8"
);

async function createServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    productResolvers,
    context: createContext,
    plugins: [],
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  return app;
}

module.exports = { createServer };
