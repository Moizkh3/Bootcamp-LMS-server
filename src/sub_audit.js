import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const std = await mongoose.connection.db.collection('users').findOne({ name: /Moiz/i });
        if (std) {
            console.log(`Moiz ID: ${std._id}`);
            const subs = await mongoose.connection.db.collection('submissions').find({ student: std._id }).toArray();
            console.log(`Submissions for Moiz: ${subs.length}`);
            subs.forEach(s => {
                console.log(`Sub: ${s.assignment}, Status: ${s.status}`);
            });
        }

        const assQuery = {
            bootcamp: std.studentBootcampId,
            status: { $in: ['published', 'Active'] }
        };
        const ass = await mongoose.connection.db.collection('assignments').find(assQuery).toArray();
        console.log(`Ass found for Moiz bootcamp: ${ass.length}`);
        ass.forEach(a => {
            console.log(`Ass: ${a.title}, D: ${a.domain}`);
        });

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

check();
