const { mergeResolvers } = require("@graphql-tools/merge");
const { authResolvers } = require("../resolvers/auth.resolver");

const resolvers = mergeResolvers([authResolvers]);

module.exports = { resolvers };
