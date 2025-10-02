import { mergeResolvers } from "@graphql-tools/merge";
import { userResolvers } from "./user.resolver.js";

export const resolvers = mergeResolvers([userResolvers]);
