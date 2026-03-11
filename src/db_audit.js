import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const annCount = await mongoose.connection.db.collection('announcements').countDocuments();
        const assCount = await mongoose.connection.db.collection('assignments').countDocuments();
        const stdCount = await mongoose.connection.db.collection('users').countDocuments({ role: 'student' });
        
        console.log(`Announcements: ${annCount}`);
        console.log(`Assignments: ${assCount}`);
        console.log(`Students: ${stdCount}`);

        const std = await mongoose.connection.db.collection('users').find({ role: 'student' }).toArray();
        std.forEach(s => {
            console.log(`Student: ${s.name}, Bootcamp: ${s.studentBootcampId}, Domain: ${s.domainId}`);
        });

        const ann = await mongoose.connection.db.collection('announcements').find({}).limit(5).toArray();
        ann.forEach(a => {
            console.log(`Announcement: ${a.title}, Bootcamp: ${a.bootcampId}, Domain: ${a.domainId}`);
        });

        const ass = await mongoose.connection.db.collection('assignments').find({}).limit(5).toArray();
        ass.forEach(a => {
            console.log(`Assignment: ${a.title}, Bootcamp: ${a.bootcamp}, Domain: ${a.domain}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
