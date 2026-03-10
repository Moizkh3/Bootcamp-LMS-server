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
  },

  { timestamps: true },
);

export default mongoose.model("Submittedassignment", submittedassignmentSchema);
