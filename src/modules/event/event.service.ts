import { PrismaClient, Prisma } from "@prisma/client";

export default function EventService({ prisma }: { prisma: PrismaClient }) {
  return {
    async createEvent(input: any) {

      const event = await prisma.event.create({
        data: {
          userId: input.userId,
          name: input.name,
          description: input.description,
          organizer: input.organizer,
          hostEmail: input.host_email,
          organizerEmail: input.organizer_email,
          guests: input.guests ?? [],
          address: input.address,
          city: input.city,
          pincode: input.pincode ?? null,
          date: new Date(input.date),
          startTime: input.start_time,
          stopTime: input.stop_time,
          media: input.media ?? [],
          sideAttractions: input.side_attractions ?? [],
          allowInstallment: input.allowInstallment ?? false,
          posterEmail: input.posterEmail,
          attendeesEmail: input.attendees_Email ?? [],

          activities: input.activities?.length
            ? {
                create: input.activities.map((a: any) => ({
                  title: a.title,
                  speaker: a.speaker,
                  time: a.time,
                })),
              }
            : undefined,

          ticketTypes: input.ticketTypes?.length
            ? {
                create: input.ticketTypes.map((t: any) => ({
                  type: t.type,
                  price: +t.price,
                  quantity: t.quantity,
                })),
              }
            : undefined,

          installmentConfig: input.installmentConfig
            ? {
                create: {
                  numberOfInstallments:
                    input.installmentConfig.numberOfInstallments,
                  minPerInstallment: input.installmentConfig.minPerInstallment,
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

      return event;
    },
  };
}
