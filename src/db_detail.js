import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const ann = await mongoose.connection.db.collection('announcements').find({}).toArray();
        ann.forEach(a => {
            console.log(`Ann: ${a.title}, B: ${a.bootcampId}, D: ${a.domainId}`);
        });

        const ass = await mongoose.connection.db.collection('assignments').find({}).toArray();
        ass.forEach(a => {
            console.log(`Ass: ${a.title}, B: ${a.bootcamp}, D: ${a.domain}, S: ${a.status}`);
        });

        const std = await mongoose.connection.db.collection('users').find({ role: 'student', name: /Moiz/i }).toArray();
        std.forEach(s => {
            console.log(`Std: ${s.name}, B: ${s.studentBootcampId}, D: ${s.domainId}`);
        });

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

check();
