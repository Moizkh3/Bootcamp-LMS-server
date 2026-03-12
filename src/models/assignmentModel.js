import mongoose from "mongoose";
import validator from "validator";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 1000,
    },

    documentUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || validator.isURL(value),
        message: "Document URL is not valid",
      },
    },

    domain: {                         
      type: mongoose.Types.ObjectId,
      ref: "Domain",
      required: true,
    },

    teacher: {                         
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    bootcamp: {
      type: mongoose.Types.ObjectId,
      ref: "Bootcamp",
      required: true,
    },

    deadline: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "Active", "Closed"],
      default: "Active",
    },
    requiredLinks: {
      type: [String],
      default: ["frontendGithubUrl"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Assignment", assignmentSchema);