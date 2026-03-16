import { Queue } from "bullmq";
import redis from "../config/redis.js";

const studentWelcomeQueue = new Queue("student-welcome-emails", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export default studentWelcomeQueue;