import mongoose from 'mongoose';
import Assignment from '../src/models/assignmentModel.js';
import dotenv from 'dotenv';
dotenv.config();
import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);


export const seedAssignments = async () => {
    try {
        let domainId = '69ab31f5a627446a5ab2fc46';
        let mentorId = '69ab31f5a627446a5ab2fc44';
        let bootcampId = '69ab31f4a627446a5ab2fc42';

        await mongoose.connect(process.env.MONGO_URI)


        const assignments = [
            {
                title: "Build REST API with Express",
                description:
                    "Create a RESTful API using Express.js with CRUD operations and proper error handling.",
                documentUrl: "https://example.com/docs/express-api-assignment",
                doamin: domainId,
                teacher: mentorId,
                bootcamp: bootcampId,
                deadline: new Date("2026-04-01"),
            },
            {
                title: "JWT Authentication System",
                description:
                    "Implement user authentication using JWT including login, signup, and protected routes.",
                documentUrl: "https://example.com/docs/jwt-auth-assignment",
                doamin: domainId,
                teacher: mentorId,
                bootcamp: bootcampId,
                deadline: new Date("2026-04-10"),
            },
            {
                title: "MongoDB Data Modeling",
                description:
                    "Design MongoDB schemas for a blog application including users, posts, and comments.",
                documentUrl: "https://example.com/docs/mongodb-modeling",
                doamin: domainId,
                teacher: mentorId,
                bootcamp: bootcampId,
                deadline: new Date("2026-04-18"),
            },
            {
                title: "Build File Upload API",
                description:
                    "Create an API that allows users to upload files using Multer and store metadata in MongoDB.",
                documentUrl: "https://example.com/docs/file-upload-api",
                doamin: domainId,
                teacher: mentorId,
                bootcamp: bootcampId,
                deadline: new Date("2026-04-25"),
            },
            {
                title: "Error Handling Middleware",
                description:
                    "Implement centralized error handling middleware in an Express application.",
                documentUrl: "https://example.com/docs/error-handling",
                doamin: domainId,
                teacher: mentorId,
                bootcamp: bootcampId,
                deadline: new Date("2026-05-05"),
            },
        ];

        const createdAssignments = await Assignment.insertMany(assignments);

        console.log(`Seeded ${createdAssignments.length} assignments`);
    } catch (error) {
        console.log(error)
    }


};

seedAssignments()
.then(()=>{
    console.log('assignments seeded')
})