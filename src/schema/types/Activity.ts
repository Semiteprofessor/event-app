import {
  objectType,
  inputObjectType,
} from "nexus";

export const Activity = objectType({
  name: "Activity",
  definition(t) {
    t.string("title");
    t.string("speaker");
    t.string("time");
  },
});

export const ActivityInput = inputObjectType({
  name: "ActivityInput",
  definition(t) {
    t.string("title");
    t.string("speaker");
    t.string("time");
  },
});
