import { Worker } from "bullmq";
import redis from "../config/redis.js";
import sendEmail from "../utils/sendMail.js";

const worker = new Worker(
  "student-welcome-emails",
  async (job) => {
    const { email, name, password, bootcampName, domainName, loginLink } = job.data;

    await sendEmail({
      to: email,
      subject: "Welcome to the Bootcamp!",
      template: "student-wellcome-email",
      context: { name, email, password, bootcampName, domainName, loginLink },
    });

    console.log(`📧 Welcome email sent to ${email}`);
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`✅ Welcome email job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Welcome email job ${job.id} failed:`, err.message);
});

console.log("🚀 Student welcome email worker started...");

export default worker;