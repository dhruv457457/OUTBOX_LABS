import { Queue } from "bullmq";
import { redis } from "../redis/client.js";
import { EMAIL_QUEUE_NAME, type EmailJobData } from "./jobTypes.js";

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 60 * 60 * 24 }, // keep a day of history for debugging
    removeOnFail: { age: 60 * 60 * 24 * 7 },
  },
});

export function scheduleEmailJob(data: EmailJobData, sendAt: Date) {
  const delay = Math.max(0, sendAt.getTime() - Date.now());
  return emailQueue.add("send", data, { jobId: data.scheduledEmailId, delay });
}
