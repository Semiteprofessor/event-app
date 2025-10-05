const { Queue } = require("bullmq");
const { redis } = require("../redis");

const emailQueue = new Queue("emailQueue", {
  connection: redis,
});

async function addEmailJob(data: any) {
  await emailQueue.add("sendEmail", data, {
    attempts: 3,
    backoff: 5000,
    removeOnComplete: true,
    removeOnFail: false,
  });
}

module.exports = { emailQueue, addEmailJob };
