import { Worker, Job } from "bullmq";
import { redis } from "../redis.js";

export const emailWorker = new Worker(
  "emailQueue",
  async (job: Job) => {
    console.log("📨 Processing email job:", job.data);
    await new Promise((res) => setTimeout(res, 1000));
    console.log(`✅ Email sent to ${job.data.email}`);
  },
  { connection: redis }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});
emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
