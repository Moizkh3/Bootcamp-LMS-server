import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

import User from "../src/models/user.js";
import Bootcamp from "../src/models/bootcampModel.js";
import Domain from "../src/models/domainSchema.js";

const seedData = async () => {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully!");
    // clear existing data
    await User.deleteMany();
    await Bootcamp.deleteMany();
    await Domain.deleteMany();

    console.log("Old data removed");

    // create admin
    const adminPassword = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      name: "Super Admin",
      email: "admin@bootcamp.com",
      password: adminPassword,
      role: "admin",
      rollNo: 9999,
    });

    console.log("Admin created");

    // create bootcamp
    const bootcamp = await Bootcamp.create({
      name: "Bootcamp 4.0",
      description: "Full stack development bootcamp",
      startDate: new Date(),
      endDate: new Date(),
      createdBy: admin._id,
    });

    console.log("Bootcamp created");

    // create teacher
    const teacherPassword = await bcrypt.hash("teacher123", 10);

    const teacher = await User.create({
      name: "John Mentor",
      email: "teacher@bootcamp.com",
      password: teacherPassword,
      role: "teacher",
      bootcampId: bootcamp._id,
      rollNo: 9998,
      teacherStatus: "active",
    });

    console.log("Teacher created");

    // create domain
    const webDomain = await Domain.create({
      title: "Web Development",
      description: "Frontend + Backend",
      bootcamp: bootcamp._id,
      mentorId: teacher._id,
    });

    const aiDomain = await Domain.create({
      title: "AI Engineering",
      description: "Machine learning track",
      bootcamp: bootcamp._id,
      mentorId: teacher._id,
    });

    teacher.domainId = webDomain._id;
    await teacher.save();

    console.log("Domains created");

    // create students
    const studentPassword = await bcrypt.hash("student123", 10);

    await User.insertMany([
      {
        name: "Student One",
        email: "student1@test.com",
        password: studentPassword,
        role: "student",
        bootcampId: bootcamp._id,
        domainId: webDomain._id,
        rollNo: 101,
        studentStatus: "enrolled",
      },
      {
        name: "Student Two",
        email: "student2@test.com",
        password: studentPassword,
        role: "student",
        bootcampId: bootcamp._id,
        domainId: aiDomain._id,
        rollNo: 102,
        studentStatus: "enrolled",
      },
    ]);

    console.log("Students created");

    console.log("Seeding completed");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();


