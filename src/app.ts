const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { createContext } = require("./context");
const { authResolvers } = require("./graphql/resolvers/auth.resolver");
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
    resolvers: {
      Query: {
        ...authResolvers.Query,
        ...productResolvers.Query,
      },
      Mutation: {
        ...authResolvers.Mutation,
        ...productResolvers.Mutation,
      },
    },
    context: ({ req }) => createContext(req),
    plugins: [],
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  return app;
}

module.exports = { createServer };
