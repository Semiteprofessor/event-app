import { Request, Response } from "express";
import { emailQueue } from "../lib/queues/emailQueue.js";

export default async function handler(req: Request, res: Response) {
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
