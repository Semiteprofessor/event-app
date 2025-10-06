const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { createContext } = require("./context");
const { authResolvers } = require("./graphql/resolvers/auth.resolver");
const { productResolvers } = require("./graphql/resolvers/product.resolver");
const path = require("path");
const fs = require("fs");

// Load all .graphql files from schema directory
const schemaDir = path.join(__dirname, "./graphql/schema");

const typeDefs = fs
  .readdirSync(schemaDir)
  .filter((file) => file.endsWith(".graphql"))
  .map((file) => fs.readFileSync(path.join(schemaDir, file), "utf8"))
  .join("\n");

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
    context: ({ req }) => createContext({ req }),
    plugins: [],
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  return app;
}

module.exports = { createServer };
