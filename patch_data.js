import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function runPatch() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        // 1. Align student domain
        const studentId = new mongoose.Types.ObjectId('69b01701a90d63aaa4afeabc');
        const domainId = new mongoose.Types.ObjectId('69b01e650fb1c214e2a1aa6c');
        
        await db.collection('users').updateOne(
            { _id: studentId },
            { $set: { domainId: domainId } }
        );
        console.log('Aligned student domain to Full Stack');
        
        // 2. Move standup
        const standupId = new mongoose.Types.ObjectId('69b113095f45905c372d79fa');
        await db.collection('progresses').updateOne(
            { _id: standupId },
            { $set: { studentId: studentId } }
        );
        console.log('Moved orphan standup to correct student account');
        
        process.exit(0);
    } catch (err) {
        console.error('Patch failed:', err);
        process.exit(1);
    }
}

runPatch();
