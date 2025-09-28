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
    t.string("organizer");
    t.string("organizer_email");
    t.string("host_email");
    t.string("posterEmail");
    t.list.string("guests");
    t.list.string("attendees_Email");
    t.string("address");
    t.string("city");
    t.int("pincode");
    t.string("date");
    t.string("start_time");
    t.string("stop_time");
    t.list.string("media");
    t.list.string("side_attractions");
    t.boolean("allowInstallment");
    t.field("installmentConfig", { type: "InstallmentConfigInput" });
    t.list.field("activities", { type: "ActivityInput" });
    t.list.field("ticketTypes", { type: "TicketTypeInput" });
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
        name: data.name,
        description: data.description,
        date: new Date(data.date),
        startTime: data.start_time,
        stopTime: data.stop_time,
        organizer: data.organizer,
        hostEmail: data.host_email,
        organizerEmail: data.organizer_email,
        guests: data.guests,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        media: data.media,
        sideAttractions: data.side_attractions,
        allowInstallment: data.allowInstallment,
        posterEmail: data.posterEmail,
        attendeesEmail: data.attendees_Email,

        creator: {
          connect: {
            id: data.userId,
          },
        },

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
