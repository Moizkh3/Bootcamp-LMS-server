import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.connection.db.collection('users');
        const Progress = mongoose.connection.db.collection('dailyprogresses');
        
        const moiz = await User.findOne({ name: /Moiz/i });
        if (!moiz) {
            console.log("Moiz not found");
            process.exit(1);
        }

        const standups = await Progress.find({ studentId: moiz._id }).sort({ createdAt: -1 }).toArray();
        console.log(`Moiz has ${standups.length} standups.`);
        
        standups.forEach(s => {
            console.log(`ID: ${s._id}, Date: ${s.date || s.createdAt}, RevAt: ${s.reviewedAt}, Mentor: ${s.mentor}, Grade: ${s.grade}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
