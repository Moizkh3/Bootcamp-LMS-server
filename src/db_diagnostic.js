import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
}

// Import models
import Progress from './models/dailyProgressModel.js';
import User from './models/user.js';
import Bootcamp from './models/bootcampModel.js';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const progressCount = await Progress.countDocuments();
        console.log(`Total Progress records: ${progressCount}`);

        if (progressCount > 0) {
            const rawProgress = await Progress.find().sort({ createdAt: -1 }).limit(1).lean();
            if (rawProgress[0]) {
                const sid = rawProgress[0].studentId;
                console.log('--- RAW TYPE CHECK ---');
                console.log('studentId Raw Value:', sid);
                console.log('studentId Type:', typeof sid);
                if (sid && sid._bsontype) {
                    console.log('studentId is BSON ObjectID');
                } else if (mongoose.Types.ObjectId.isValid(sid) && typeof sid === 'string') {
                    console.log('studentId is STRING (though valid as ID)');
                } else {
                    console.log('studentId is OTHER/UNKNOWN');
                }
            }

            const latestProgress = await Progress.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('studentId', 'name email rollNo')
                .lean();
            
            for (const p of latestProgress) {
                console.log('--- Progress Record with Populate ---');
                console.log('ID:', p._id);
                console.log('studentId Type:', typeof p.studentId);
                console.log('studentId Content:', JSON.stringify(p.studentId, null, 2));
                
                if (p.studentId && typeof p.studentId === 'object' && p.studentId.name) {
                    console.log('Population SUCCESS:', p.studentId.name);
                } else {
                    console.log('Population FAILED or incomplete!');
                }
            }
        } else {
            console.log("No progress records found.");
        }

        const sampleUsers = await User.find({ role: 'student' }).limit(3).lean();
        console.log('--- Sample Students ---');
        sampleUsers.forEach(u => console.log(u._id, u.name, u.email));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
