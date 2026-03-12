import User from "../models/user.js";
import Progress from "../models/dailyProgressModel.js";
import Submission from "../models/submissionModel.js";
import Assignment from "../models/assignmentModel.js";
import mongoose from "mongoose";

// Fetch students assigned to the teacher's bootcamps
export const getTeacherStudents = async (req, res) => {
  try {
    const teacher = req.user;
    if (!teacher.teacherBootcampIds || teacher.teacherBootcampIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const students = await User.find({
      role: "student",
      studentBootcampId: { $in: teacher.teacherBootcampIds },
    })
      .select("-password")
      .populate("studentBootcampId", "name")
      .populate("domainId", "name")
      .sort({ rollNo: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Fetch individual student details: Standups and Assignments
export const getStudentFullProgress = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify student exists and is in teacher's bootcamp (optional but recommended)
    const student = await User.findOne({ _id: studentId, role: "student" }).select("-password");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Fetch Daily Progress (Standups)
    const standups = await Progress.find({ studentId })
      .sort({ date: -1 })
      .populate("mentor", "name");

    // Fetch Assignment Submissions
    const submissions = await Submission.find({ student: studentId })
      .populate("assignment", "title deadline")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        student,
        standups,
        submissions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Give feedback and grade on a daily standup
export const giveStandupFeedback = async (req, res) => {
  try {
    const { standupId } = req.params;
    const { grade, feedback } = req.body;

    const progress = await Progress.findByIdAndUpdate(
      standupId,
      {
        grade,
        feedback,
        mentor: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Standup record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Feedback provided successfully",
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
