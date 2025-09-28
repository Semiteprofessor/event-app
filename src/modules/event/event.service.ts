import { PrismaClient, Prisma } from "@prisma/client";

export default function EventService({ prisma }: { prisma: PrismaClient }) {
  return {
    async createEvent(input: any) {
      const event = await prisma.event.create({
        data: {
          name: input.name,
          description: input.description,
          organizerId: input.userId,
          organizerName: input.organizer,
          organizerEmail: input.organizer_email,
          hostEmail: input.host_email,
          posterEmail: input.posterEmail,
          guests: input.guests ?? [],
          attendeesEmail: input.attendees_Email ?? [],
          address: input.address,
          city: input.city,
          pincode: input.pincode ?? undefined,
          date: new Date(input.date),
          startTime: input.start_time,
          stopTime: input.stop_time,
          allowInstallment: input.allowInstallment ?? false,
          sideAttractions: input.side_attractions ?? [],
          installmentConfig: input.installmentConfig
            ? {
                create: {
                  numberOfInstallments:
                    input.installmentConfig.numberOfInstallments,
                  minPerInstallment: input.installmentConfig.minPerInstallment,
                },
              }
            : undefined,
          media: {
            create: input.media?.map((url: string) => ({ url })) || [],
          },
          ticketTypes: {
            create:
              input.ticketTypes?.map((t: any) => ({
                type: t.type,
                price: t.price,
                quantity: t.quantity,
              })) || [],
          },
          activities: {
            create:
              input.activities?.map((a: any) => ({
                title: a.title,
                speaker: a.speaker,
                time: a.time,
              })) || [],
          },
        },
        include: {
          media: true,
          ticketTypes: true,
          activities: true,
          installmentConfig: true,
        },
      });

      return event;
    },
  };
}
