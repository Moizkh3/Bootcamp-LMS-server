import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bootcamp from '../models/bootcampModel.js';
import Domain from '../models/domainSchema.js';

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const domains = await Domain.find({});
        console.log(`Found ${domains.length} domains to process`);

        for (const domain of domains) {
            if (domain.bootcamp) {
                const bootcamp = await Bootcamp.findById(domain.bootcamp);
                if (bootcamp) {
                    if (!bootcamp.domains.includes(domain._id)) {
                        bootcamp.domains.push(domain._id);
                        await bootcamp.save();
                        console.log(`Linked domain "${domain.name}" to bootcamp "${bootcamp.name}"`);
                    } else {
                        console.log(`Domain "${domain.name}" already linked to bootcamp "${bootcamp.name}"`);
                    }
                } else {
                    console.warn(`Bootcamp not found for domain "${domain.name}" (ID: ${domain.bootcamp})`);
                }
            } else {
                console.log(`Domain "${domain.name}" has no bootcamp assigned`);
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
