import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const bootcamps = await mongoose.connection.db.collection('bootcamps').find({}).toArray();
        console.log('--- BOOTCAMPS ---');
        bootcamps.forEach(b => {
            console.log(`Name: ${b.name}, ID: ${b._id}`);
        });

        const students = await mongoose.connection.db.collection('users').find({ role: 'student' }).toArray();
        console.log('\n--- STUDENTS ---');
        students.forEach(s => {
            console.log(`Name: ${s.name}, BootcampID: ${s.studentBootcampId}`);
        });

        const announcements = await mongoose.connection.db.collection('announcements').find({}).toArray();
        console.log('\n--- ANNOUNCEMENTS ---');
        announcements.forEach(a => {
            console.log(`Title: ${a.title}, BootcampID: ${a.bootcampId}`);
        });

        const assignments = await mongoose.connection.db.collection('assignments').find({}).toArray();
        console.log('\n--- ASSIGNMENTS ---');
        assignments.forEach(a => {
            console.log(`Title: ${a.title}, BootcampID: ${a.bootcamp}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
