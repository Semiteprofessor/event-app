import { mergeResolvers } from "@graphql-tools/merge";
import { userResolvers } from "./auth.resolver.js";

export const resolvers = mergeResolvers([userResolvers]);
