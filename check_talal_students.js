import dotenv from 'dotenv';
dotenv.config();
import db from './src/config/db.js';
import User from './src/models/user.js';
import mongoose from 'mongoose';

async function check() {
    await db();
    
    const teacherId = "69b015ff72e866eddd79041d";
    const bootcampIds = [new mongoose.Types.ObjectId("69b014ef68c3240205c573e0")];
    const domainId = new mongoose.Types.ObjectId("69b01e650fb1c214e2a1aa6c");

    const studentQueryConditions = [];
    studentQueryConditions.push({ studentBootcampId: { $in: bootcampIds } });
    studentQueryConditions.push({ domainId: domainId });

    const studentQuery = {
        role: 'student',
        studentStatus: 'enrolled',
        $or: studentQueryConditions
    };

    console.log("Query:", JSON.stringify(studentQuery, null, 2));
    
    const count = await User.countDocuments(studentQuery);
    console.log("Count:", count);

    const students = await User.find(studentQuery).lean();
    console.log("Matching Students:", JSON.stringify(students, null, 2));

    process.exit(0);
}

check();
