import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const s = await mongoose.connection.db.collection('users').findOne({ name: /Moiz/i });
        const a = await mongoose.connection.db.collection('assignments').findOne({});
        
        if (s) {
            console.log('Std B:', s.studentBootcampId, 'Type:', typeof s.studentBootcampId, 'Class:', s.studentBootcampId?.constructor.name);
            console.log('Std D:', s.domainId, 'Type:', typeof s.domainId, 'Class:', s.domainId?.constructor.name);
        }
        if (a) {
            console.log('Ass B:', a.bootcamp, 'Type:', typeof a.bootcamp, 'Class:', a.bootcamp?.constructor.name);
            console.log('Ass D:', a.domain, 'Type:', typeof a.domain, 'Class:', a.domain?.constructor.name);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
