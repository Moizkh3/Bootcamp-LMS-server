import mongoose from "mongoose";
const progressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bootcampId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bootcamp",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    yesterdayWork: {
      type: String,
      required: true,
    },
    todayPlan: {
      type: String,
      required: true,
    },
    blockers: {
      type: String,
      default: "",
    },
    githubLink: {
      type: String,
      default: "",
    },
    hoursWorked: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Progress", progressSchema);
