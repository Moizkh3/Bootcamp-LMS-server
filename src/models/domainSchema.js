import mongoose from "mongoose";

const domainSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },
    bootcamp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bootcamp',
        required: true
    },
    status: {
        type: String,
        default: 'Active',
        enum: ['Active', 'Inactive', 'Archived']
    },
    type: {
        type: String,
        default: 'Core Track',
        enum: ['Core Track', 'Specialized', 'Elective']
    },
    mentorName: {
        type: String,
        trim: true
    },
    mentorAvatar: {
        type: String,
        trim: true
    },
    studentsCount: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

export default mongoose.model('Domain', domainSchema);