import { objectType, extendType, stringArg, nonNull, intArg } from "nexus";

export const Event = objectType({
  name: "Event",
  definition(t) {
    t.nonNull.string("id");
    t.string("name");
    t.string("description");
    t.string("address");
    t.string("city");
    t.int("pincode");
    t.field("date", { type: "String" });
    t.list.field("media", {
      type: "String",
      resolve: (parent) => parent.media?.map((m: any) => m.url) || [],
    });
  },
});

export const EventQuery = extendType({
  type: "Query",
  definition(t) {
    t.list.field("events", {
      type: "Event",
      args: {
        skip: intArg(),
        take: intArg(),
      },
      resolve: (_, { skip = 0, take = 20 }, ctx) => {
        return ctx.prisma.event.findMany({
          skip,
          take,
          include: { media: true },
          orderBy: { date: "desc" },
        });
      },
    });
  },
});

export const EventMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createEvent", {
      type: "Event",
      args: {
        name: nonNull(stringArg()),
        description: stringArg(),
        address: stringArg(),
        city: stringArg(),
        pincode: intArg(),
        date: stringArg(),
        // add other args / or accept an Input type
      },
      resolve: async (_, args, ctx) => {
        return ctx.services.event.createEvent({
          ...args,
          organizerId: ctx.user.id,
        });
      },
    });
  },
});
