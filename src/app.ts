import express from "express";
import { ApolloServer } from "apollo-server-express";
import { schema } from "./schema/graphql.js";
import { createContext } from "./context.js";

export async function createServer() {
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
