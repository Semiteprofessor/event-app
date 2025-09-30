import { mutationField, nonNull, arg } from "nexus";
import EventService from "./event.service.js";
import { Context } from "../../context.js";

export const createEvent = mutationField("createEvent", {
  type: "Event",
  args: {
    data: nonNull(arg({ type: "EventInput" })),
  },
  resolve: async (_, { data }, ctx: Context) => {
    const eventService = EventService({ prisma: ctx.prisma });
    return await eventService.createEvent(data);
  },
});
``;
