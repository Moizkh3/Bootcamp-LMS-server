import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const ann = await mongoose.connection.db.collection('announcements').findOne({});
        const ass = await mongoose.connection.db.collection('assignments').findOne({});
        const std = await mongoose.connection.db.collection('users').findOne({ name: /Moiz/i });
        
        if (ann) console.log(`Ann B ID: ${ann.bootcampId}, Length: ${ann.bootcampId?.toString().length}`);
        if (ass) console.log(`Ass B ID: ${ass.bootcamp}, Length: ${ass.bootcamp?.toString().length}`);
        if (std) console.log(`Std B ID: ${std.studentBootcampId}, Length: ${std.studentBootcampId?.toString().length}`);

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
