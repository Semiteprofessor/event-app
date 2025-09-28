import { mutationField, nonNull } from "nexus";
import { Context } from "../../context";

export const createEvent = mutationField("createEvent", {
  type: "Event",
  args: {
    data: nonNull("EventInput"),
  },
  resolve: async (_, { data }, ctx: Context) => {
    return await ctx.prisma.event.create({
      data: {
        userId: data.userId,
        organizerId: data.userId,
        name: data.name,
        description: data.description,
        organizerName: data.organizer,
        organizerEmail: data.organizer_email,
        hostEmail: data.host_email,
        posterEmail: data.posterEmail,
        guests: data.guests ?? [],
        attendeesEmail: data.attendees_Email ?? [],
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        date: new Date(data.date),
        startTime: data.start_time,
        stopTime: data.stop_time,
        allowInstallment: data.allowInstallment ?? false,
        sideAttractions: data.side_attractions ?? [],

        media: {
          create: data.media?.map((url: string) => ({ url })) ?? [],
        },

        activities: data.activities
          ? {
              create: data.activities.map((a: any) => ({
                title: a.title,
                speaker: a.speaker,
                time: a.time,
              })),
            }
          : undefined,

        ticketTypes: data.ticketTypes
          ? {
              create: data.ticketTypes.map((t: any) => ({
                name: t.type,
                price: t.price,
                limit: t.quantity,
              })),
            }
          : undefined,

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
        media: true,
        ticketTypes: true,
        activities: true,
        installmentConfig: true,
      },
    });
  },
});
