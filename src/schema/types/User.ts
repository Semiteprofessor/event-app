import { objectType, extendType, stringArg, nonNull } from "nexus";

export const User = objectType({
  name: "User",
  definition(t) {
    t.nonNull.string("id");
    t.string("name");
    t.string("email");
    t.field("role", { type: "String" });
    t.string("createdAt");
  },
});

export const AuthPayload = objectType({
  name: "AuthPayload",
  definition(t) {
    t.nonNull.string("accessToken");
    t.string("refreshToken");
    t.field("user", { type: "User" });
  },
});

export const AuthMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("signup", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
        name: stringArg(),
      },
      resolve: async (_, { email, password, name }, ctx) => {
        return ctx.services.auth.signup({ email, password, name });
      },
    });

    t.field("login", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: async (_, { email, password }, ctx) => {
        return ctx.services.auth.login({ email, password });
      },
    });
  },
});
