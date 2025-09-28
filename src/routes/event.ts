
import { NextApiRequest, NextApiResponse } from "next";
import { emailQueue } from "../lib/queues/emailQueue";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { name, organizerEmail } = req.body;

    await emailQueue.add("sendEmail", {
      email: organizerEmail,
      subject: `Event "${name}" Created`,
      message: "Your event was successfully created 🎉",
    });

    return res.status(201).json({ message: "Event created & email queued" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
