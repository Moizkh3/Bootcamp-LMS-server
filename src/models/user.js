import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
    },

    teacherBootcampIds:{
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Bootcamp",
      required: function () {
        return this.role === "teacher";
      }
    },

    studentBootcampId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bootcamp",
      required: function () {
        return this.role === "student";
      }
    },

    domainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
      required: function () {
        return this.role === "student";
      }
    },

    teacherDomainIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Domain",
      required: function () {
        return this.role === "teacher";
      },
      default: []
    },

    studentStatus: {
      type: String,
      enum: ["completed", "dropout", "enrolled"],
      required: function () {
        return this.role === "student";
      }
    },

    teacherStatus: {
      type: String,
      enum: ["active", "inactive"],
      required: function () {
        return this.role === "teacher";
      }
    },

    otp: {
      type: String,
      default: null
    },

    rollNo:{
      type: Number,
      required: true
    },

    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    lastNotificationCheck: {
      type: Date,
      default: Date.now
    }

  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
