import mongoose from "mongoose";

const utlisSchema = new mongoose.Schema({
    rollNo: {
        type: Number,
        required: true,
    },

}, { timestamps: true });

export default mongoose.model("Utils", utlisSchema);