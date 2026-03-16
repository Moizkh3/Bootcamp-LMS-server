import { Worker } from "bullmq";
import redis from "../config/redis.js";
import User from "../models/user.js";
import sendEmail from "../utils/sendMail.js";

const worker = new Worker(
  "assignment-emails",
  async (job) => {
    const { assignmentId, domainId, bootcampId, assignmentTitle,
            description, deadline, module, teacherName,
            bootcampName, domainName } = job.data;

    console.log(`📨 Processing email job for assignment: ${assignmentTitle}`);

    // Sirf usi domain + bootcamp ke enrolled students fetch karo
    const students = await User.find({
      role: "student",
      studentStatus: "enrolled",
      domainId: domainId,           // ← yahi key filter hai
      studentBootcampId: bootcampId,
    }).select("name email");

    if (!students.length) {
      console.log("⚠️ No students found for this domain/bootcamp");
      return { sent: 0 };
    }

    console.log(`📧 Sending emails to ${students.length} students...`);

    // Emails bhejo — parallel (Promise.allSettled taaki ek fail se baaki na ruke)
    const results = await Promise.allSettled(
      students.map((student) =>
        sendEmail({
          to: student.email,
          subject: `📚 New Assignment: ${assignmentTitle}`,
          template: "assignment-notification",
          context: {
            studentName: student.name,
            assignmentTitle,
            description,
            deadline: new Date(deadline).toLocaleDateString("en-PK", {
              weekday: "long", year: "numeric",
              month: "long", day: "numeric",
            }),
            module: module || "N/A",
            teacherName,
            bootcampName,
            domainName,
            appUrl: process.env.FRONTEND_URL || "http://localhost:5173",
          },
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`✅ Emails sent: ${sent}, ❌ Failed: ${failed}`);
    return { sent, failed, total: students.length };
  },
  {
    connection: redis,
    concurrency: 5, // ek waqt mein 5 jobs parallel chalao
  }
);

// Worker events — monitoring ke liye
worker.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed | Sent: ${result.sent}/${result.total}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed | Error: ${err.message}`);
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err.message);
});

console.log("🚀 Assignment email worker started...");

export default worker;