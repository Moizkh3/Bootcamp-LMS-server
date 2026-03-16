import dotenv from "dotenv";
dotenv.config();
import redis from "./config/redis.js";
import assignmentEmailQueue from "./queues/assignmentQueue.js";
import studentWelcomeQueue from "./queues/studentWelcomeQueue.js";

async function diagnostic() {
  console.log("🔍 Running Redis/Queue Diagnostic...");
  
  try {
    const ping = await redis.ping();
    console.log("✅ Redis Ping:", ping);
    
    const assignCount = await assignmentEmailQueue.getJobCounts();
    console.log("📊 Assignment Queue Jobs:", assignCount);
    
    const welcomeCount = await studentWelcomeQueue.getJobCounts();
    console.log("📊 Welcome Queue Jobs:", welcomeCount);

    const failedAssign = await assignmentEmailQueue.getFailed();
    console.log(`❌ Failed Assignment Jobs: ${failedAssign.length}`);
    if (failedAssign.length > 0) {
      console.log("Reason for first failure:", failedAssign[0].failedReason);
    }
    
    const completedAssign = await assignmentEmailQueue.getCompleted();
    console.log(`✅ Completed Assignment Jobs: ${completedAssign.length}`);
    
    const completedWelcome = await studentWelcomeQueue.getCompleted();
    console.log(`✅ Completed Welcome Jobs: ${completedWelcome.length}`);

    const failedWelcome = await studentWelcomeQueue.getFailed();
    console.log(`❌ Failed Welcome Jobs: ${failedWelcome.length}`);
    if (failedWelcome.length > 0) {
      console.log("Reason for first Welcome failure:", failedWelcome[0].failedReason);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Diagnostic Failed:", err.message);
    process.exit(1);
  }
}

diagnostic();
