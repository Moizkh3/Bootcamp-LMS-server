import mongoose from "mongoose";
const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  description: {
    type : String,
    required : ture
  },

  bootcampId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bootcamp",
    required : true
  },

  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Domain"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

export const Announcement = mongoose.model("Announcement", announcementSchema)