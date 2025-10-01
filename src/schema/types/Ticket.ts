import { objectType, inputObjectType } from "nexus";

export const TicketType = objectType({
  name: "TicketType",
  definition(t) {
    t.string("type");
    t.float("price");
    t.int("quantity");
  },
});

export const TicketTypeInput = inputObjectType({
  name: "TicketTypeInput",
  definition(t) {
    t.string("type");
    t.float("price");
    t.int("quantity");
  },
});
