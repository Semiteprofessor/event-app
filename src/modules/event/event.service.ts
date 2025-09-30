// import { mutationField, nonNull, arg } from "nexus";
// import { Context } from "../../context.js";

// export const createEvent = mutationField("createEvent", {
//   type: "Event",
//   args: {
//     data: nonNull(arg({ type: "EventInput" })),
//   },
//   resolve: async (_, { data }, ctx: Context) => {
//     return await ctx.prisma.event.create({
//       data: {
//         userId: data.userId,
//         organizerId: data.userId,
//         name: data.name,
//         description: data.description,
//         organizerName: data.organizer,
//         organizerEmail: data.organizer_email,
//         hostEmail: data.host_email,
//         posterEmail: data.posterEmail,
//         guests: data.guests ?? [],
//         attendeesEmail: data.attendees_Email ?? [],
//         address: data.address,
//         city: data.city,
//         pincode: data.pincode,
//         date: new Date(data.date),
//         startTime: data.start_time,
//         stopTime: data.stop_time,
//         allowInstallment: data.allowInstallment ?? false,
//         sideAttractions: data.side_attractions ?? [],

//         media: {
//           create: data.media?.map((url: string) => ({ url })) ?? [],
//         },

//         activities: data.activities
//           ? {
//               create: data.activities.map((a: any) => ({
//                 title: a.title,
//                 speaker: a.speaker,
//                 time: a.time,
//               })),
//             }
//           : undefined,

//         ticketTypes: data.ticketTypes
//           ? {
//               create: data.ticketTypes.map((t: any) => ({
//                 name: t.type,
//                 price: t.price,
//                 limit: t.quantity,
//               })),
//             }
//           : undefined,

//         installmentConfig: data.installmentConfig
//           ? {
//               create: {
//                 numberOfInstallments:
//                   data.installmentConfig.numberOfInstallments,
//                 minPerInstallment: data.installmentConfig.minPerInstallment,
//               },
//             }
//           : undefined,
//       },
//       include: {
//         media: true,
//         ticketTypes: true,
//         activities: true,
//         installmentConfig: true,
//       },
//     });
//   },
// });

// src/modules/event/event.service.ts
import { PrismaClient } from "@prisma/client";

export function EventService(prisma: PrismaClient) {
  return {
    async createEvent(input: any) {
      return await prisma.event.create({
        data: {
          userId: input.userId,
          organizerId: input.userId,
          name: input.name,
          description: input.description,
          organizerName: input.organizer,
          organizerEmail: input.organizer_email,
          hostEmail: input.host_email,
          posterEmail: input.posterEmail,
          guests: input.guests ?? [],
          attendeesEmail: input.attendees_Email ?? [],
          address: input.address,
          city: input.city,
          pincode: input.pincode,
          date: new Date(input.date),
          startTime: input.start_time,
          stopTime: input.stop_time,
          allowInstallment: input.allowInstallment ?? false,
          sideAttractions: input.side_attractions ?? [],
          media: {
            create: input.media?.map((url: string) => ({ url })) ?? [],
          },
          activities: input.activities
            ? {
                create: input.activities.map((a: any) => ({
                  title: a.title,
                  speaker: a.speaker,
                  time: a.time,
                })),
              }
            : undefined,
          ticketTypes: input.ticketTypes
            ? {
                create: input.ticketTypes.map((t: any) => ({
                  name: t.type,
                  price: t.price,
                  limit: t.quantity,
                })),
              }
            : undefined,
          installmentConfig: input.installmentConfig
            ? {
                create: {
                  numberOfInstallments:
                    input.installmentConfig.numberOfInstallments,
                  minPerInstallment:
                    input.installmentConfig.minPerInstallment,
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
  };
}
