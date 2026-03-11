import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log(`Total users: ${users.length}`);
        users.forEach(u => {
            console.log(`Name: ${u.name}, Role: ${u.role}, B: ${u.studentBootcampId}, Raw: ${JSON.stringify(u.studentBootcampId)}`);
        });
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

check();
