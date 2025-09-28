import { makeSchema } from "nexus";
import * as path from "path";
import * as types from "./types/Event.js";

export const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(process.cwd(), "schema.graphql"),
    typegen: path.join(process.cwd(), "nexus-typegen.ts"),
  },
  contextType: {
    module: path.join(process.cwd(), "src", "context.ts"),
    export: "Context",
  },
});
