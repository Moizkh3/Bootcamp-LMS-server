import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

import User from "./src/models/user.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({});
  console.log("All existing user emails:");
  users.forEach((u) => console.log(u.email));
  process.exit();
}

run();
