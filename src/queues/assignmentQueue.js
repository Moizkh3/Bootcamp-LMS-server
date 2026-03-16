import { Queue } from "bullmq";
import redis from "../config/redis.js";

// Ek queue banao assignment emails ke liye
const assignmentEmailQueue = new Queue("assignment-emails", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,           // fail hone par 3 baar try karo
    backoff: {
      type: "exponential",
      delay: 5000,         // 5s, 10s, 20s
    },
    removeOnComplete: 100, // last 100 completed jobs rakho
    removeOnFail: 50,
  },
});

export default assignmentEmailQueue;