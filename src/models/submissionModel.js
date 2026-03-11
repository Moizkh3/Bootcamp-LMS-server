import mongoose from "mongoose";
import validator from "validator";

const submittedassignmentSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    student: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    frontendGithubUrl: {
      type: String,
    },

    backendGithubUrl: {
      type: String,
    },

    referenceFile: {
      type: String,
    },

    deployedUrl: {
      type: String,
    },

    note: {
      type: String,
    },
    status: {
      type: String,
      enum: ["submitted", "graded", "re-submit", "late", "under-review"],
      default: "submitted",
    },
    grade: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      trim: true,
    },
  },

  { timestamps: true },
);

export default mongoose.model("Submittedassignment", submittedassignmentSchema);
