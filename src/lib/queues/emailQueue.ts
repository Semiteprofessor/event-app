import { Queue } from "bullmq";
import { redis } from "../redis.js";

export const emailQueue = new Queue("emailQueue", {
  connection: redis,
});

export async function addEmailJob(data: {
  to: string;
  subject: string;
  body: string;
}) {
  await emailQueue.add("sendEmail", data, {
    attempts: 3,
    backoff: 5000,
    removeOnComplete: true,
    removeOnFail: false,
  });
}
