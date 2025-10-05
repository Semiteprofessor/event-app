const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { schema } = require("./schema/graphql.js");
const { createContext } = require("./context.js");

async function createServer() {
  const app = express();

  const server = new ApolloServer({
    schema,
    context: createContext,
    plugins: [],
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  return app;
}

module.exports = { createServer };
