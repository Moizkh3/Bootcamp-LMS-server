import mongoose from "mongoose";

const domainSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

} , { timestamps: true });

export default mongoose.model('Domain', domainSchema );