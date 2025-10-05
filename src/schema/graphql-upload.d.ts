const { GraphQLScalarType } = require("graphql");

function graphqlUploadExpress(options) {
  return function (req, res, next) {
    next();
  };
}

const GraphQLUpload = new GraphQLScalarType({
  name: "Upload",
  description: "The `Upload` scalar type represents a file upload.",
  parseValue(value) {
    return value;
  },
  serialize(value) {
    return value;
  },
  parseLiteral(ast) {
    return ast.value;
  },
});

module.exports = {
  graphqlUploadExpress,
  GraphQLUpload,
};
