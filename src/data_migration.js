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

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for Migration");

        const allProgress = await Progress.find({}).lean();
        console.log(`Checking ${allProgress.length} records...`);

        let updatedCount = 0;
        for (const p of allProgress) {
            if (typeof p.studentId === 'string' && mongoose.Types.ObjectId.isValid(p.studentId)) {
                await Progress.updateOne(
                    { _id: p._id },
                    { $set: { studentId: new mongoose.Types.ObjectId(p.studentId) } }
                );
                updatedCount++;
            }
        }

        console.log(`Migration Complete: ${updatedCount} records updated.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
