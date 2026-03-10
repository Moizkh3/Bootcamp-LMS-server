import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB with URI:", process.env.MONGO_URI?.substring(0, 20) + "...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log("MongoDB connected successfully to Atlas!");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // In serverless, we might want to throw to let the function fail early
    throw error;
  }
};

export default connectDB;

