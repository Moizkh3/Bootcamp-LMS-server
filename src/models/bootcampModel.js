import mongoose from "mongoose";

const bootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String
    },
    startDate: {
      required: true,
      type: String,
    },
    endDate: {
      required: true,
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "completed" ],
      default: "active",
    },

    domains: {
      type: [mongoose.Types.ObjectId],
      ref: 'Domain',
      required: true,
    },

    teachers: {
      type: [mongoose.Types.ObjectId],
      ref: 'User',
      required: true,
    },


  },
  { timestamps: true },
);
export default mongoose.model("Bootcamp", bootcampSchema);
