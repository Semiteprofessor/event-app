const express = require("express");
const { createBullBoard } = require("@bull-board/api");
const { ExpressAdapter } = require("@bull-board/express");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { emailQueue } = require("../lib/queues/emailQueue");

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

serverAdapter.setBasePath("/admin/queues");

const dashboardRouter = serverAdapter.getRouter();

module.exports = { dashboardRouter };
