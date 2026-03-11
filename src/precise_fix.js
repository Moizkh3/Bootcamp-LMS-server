import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const ann = await mongoose.connection.db.collection('announcements').findOne({});
        if (!ann) {
            console.log("No announcement found");
            process.exit(1);
        }
        const bId = ann.bootcampId;
        console.log(`Found ID: ${bId}, Type: ${typeof bId}, Instanceof ObjectId: ${bId instanceof mongoose.Types.ObjectId}`);
        
        const result = await mongoose.connection.db.collection('users').updateOne(
            { name: /Moiz/i },
            { $set: { studentBootcampId: bId } }
        );
        console.log(`Updated ${result.modifiedCount} Moiz to B: ${bId}`);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
fix();
