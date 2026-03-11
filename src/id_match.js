import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const std = await mongoose.connection.db.collection('users').findOne({ name: /Moiz/i });
        const ann = await mongoose.connection.db.collection('announcements').find({}).toArray();
        const ass = await mongoose.connection.db.collection('assignments').find({}).toArray();

        console.log(`Moiz Bootcamp ID: ${std?.studentBootcampId}`);
        console.log(`Moiz Domain ID: ${std?.domainId}`);

        console.log("\nAnnouncements:");
        ann.forEach(a => {
            console.log(`- Title: ${a.title}, Bootcamp: ${a.bootcampId}, Match: ${std?.studentBootcampId?.toString() === a.bootcampId?.toString()}`);
        });

        console.log("\nAssignments:");
        ass.forEach(a => {
            console.log(`- Title: ${a.title}, Bootcamp: ${a.bootcamp}, Match: ${std?.studentBootcampId?.toString() === a.bootcamp?.toString()}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
