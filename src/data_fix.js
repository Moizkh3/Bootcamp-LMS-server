import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Find the bootcamp ID from announcements/assignments
        const ann = await mongoose.connection.db.collection('announcements').findOne({});
        const ass = await mongoose.connection.db.collection('assignments').findOne({});
        
        const bootcampId = ann?.bootcampId || ass?.bootcamp;
        
        if (!bootcampId) {
            console.log("No bootcamp found in announcements or assignments.");
            process.exit(1);
        }

        console.log(`Target Bootcamp ID: ${bootcampId}`);

        // Update Moiz
        const result = await mongoose.connection.db.collection('users').updateMany(
            { role: 'student' }, 
            { $set: { studentBootcampId: bootcampId } }
        );

        console.log(`Updated ${result.modifiedCount} students to bootcamp ${bootcampId}`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();
