import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function forceFix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const targetBootcampId = new mongoose.Types.ObjectId("67d0205c573e09b014ef68c3240");

        const result = await mongoose.connection.db.collection('users').updateMany(
            { role: 'student' }, 
            { $set: { studentBootcampId: targetBootcampId } }
        );

        console.log(`Force updated ${result.modifiedCount} students to bootcamp ${targetBootcampId}`);
        
        // Also ensure announcements and assignments use this ID if they don't already
        // (But from my audit they already did)

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

forceFix();
