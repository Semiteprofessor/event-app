import {
  objectType,
  inputObjectType,
  mutationField,
  nonNull,
  list,
  stringArg,
  intArg,
  booleanArg,
} from "nexus";
import { Context } from "../../context";

export const ActivityInput = inputObjectType({
  name: "ActivityInput",
  definition(t) {
    t.nonNull.string("title");
    t.nonNull.string("speaker");
    t.nonNull.string("time");
  },
});

export const TicketTypeInput = inputObjectType({
  name: "TicketTypeInput",
  definition(t) {
    t.nonNull.string("type");
    t.nonNull.float("price");
    t.nonNull.int("quantity");
  },
});

export const InstallmentConfigInput = inputObjectType({
  name: "InstallmentConfigInput",
  definition(t) {
    t.nonNull.int("numberOfInstallments");
    t.nonNull.float("minPerInstallment");
  },
});

export const EventInput = inputObjectType({
  name: "EventInput",
  definition(t) {
    t.nonNull.string("userId");
    t.nonNull.string("name");
    t.nonNull.string("description");
    t.nonNull.string("organizer");
    t.nonNull.string("host_email");
    t.nonNull.string("organizer_email");
    t.list.string("guests");
    t.nonNull.string("address");
    t.nonNull.string("city");
    t.nonNull.int("pincode");
    t.nonNull.string("date");
    t.nonNull.string("start_time");
    t.nonNull.string("stop_time");
    t.list.string("media");
    t.list.string("side_attractions");
    t.list.field("activities", { type: ActivityInput });
    t.list.field("ticketTypes", { type: TicketTypeInput });
    t.nonNull.boolean("allowInstallment");
    t.field("installmentConfig", { type: InstallmentConfigInput });
    t.nonNull.string("posterEmail");
    t.list.string("attendees_Email");
  },
});

export const Event = objectType({
  name: "Event",
  definition(t) {
    t.string("id");
    t.string("name");
    t.string("description");
    t.string("organizer");
    t.string("hostEmail");
    t.string("organizerEmail");
    t.list.string("guests");
    t.string("address");
    t.string("city");
    t.int("pincode");
    t.string("date");
    t.string("startTime");
    t.string("stopTime");
    t.list.string("media");
    t.list.string("sideAttractions");
    t.list.field("activities", { type: "Activity" });
    t.list.field("ticketTypes", { type: "TicketType" });
    t.boolean("allowInstallment");
    t.field("installmentConfig", { type: "InstallmentConfig" });
    t.string("posterEmail");
    t.list.string("attendeesEmail");
  },
});

export const createEvent = mutationField("createEvent", {
  type: "Event",
  args: {
    data: nonNull("EventInput"),
  },
  resolve: async (_, { data }, ctx: Context) => {
    return await ctx.prisma.event.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description,
        organizer: data.organizer,
        hostEmail: data.host_email,
        organizerEmail: data.organizer_email,
        guests: data.guests,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        date: new Date(data.date),
        startTime: data.start_time,
        stopTime: data.stop_time,
        media: data.media,
        sideAttractions: data.side_attractions,
        allowInstallment: data.allowInstallment,
        posterEmail: data.posterEmail,
        attendeesEmail: data.attendees_Email,
        activities: {
          create: data.activities?.map((a: any) => ({
            title: a.title,
            speaker: a.speaker,
            time: a.time,
          })),
        },
        ticketTypes: {
          create: data.ticketTypes?.map((t: any) => ({
            type: t.type,
            price: t.price,
            quantity: t.quantity,
          })),
        },
        installmentConfig: data.installmentConfig
          ? {
              create: {
                numberOfInstallments:
                  data.installmentConfig.numberOfInstallments,
                minPerInstallment: data.installmentConfig.minPerInstallment,
              },
            }
          : undefined,
      },
      include: {
        activities: true,
        ticketTypes: true,
        installmentConfig: true,
      },
    });
  },
});
