import Assignment from "../models/assignmentModel.js";
import SubmitAssignment from "../models/submissionModel.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// create assignment
export const createAssignment = async (req, res) => {
  try {
    const { title, description, deadline } = req.body; // ✅ bootcamp req.body se nahi lenge

    if (!title || !description || !deadline) {
      return res.status(400).send({
        success: false,
        message: "All required fields are required",
      });
    }

    if (!req.user.bootcampId) {
      return res.status(403).send({
        success: false,
        message: "You are not assigned to any bootcamp",
      });
    }

    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Assignment document is required",
      });
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).send({
        success: false,
        message: "Deadline cannot be in the past",
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "bootcamp-submissions",
    });

    fs.unlinkSync(req.file.path); // ✅ Fix: local temp file delete karo upload ke baad

    const assignment = await Assignment.create({
      title,
      description,
      documentUrl: result.secure_url,
      domain: req.user.domainId,       // ✅ Fix: "domain" (typo fix)
      bootcamp: req.user.bootcampId,   // ✅ Fix: "bootcamp" not "bootcampId"
      deadline: deadlineDate,
      teacher: req.user._id,           // ✅ Fix: "mentor" → "teacher"
    });

    res.status(201).send({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// get assignments
export const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      teacher: req.user._id,           // ✅ Fix: "mentor" → "teacher"
      bootcamp: req.user.bootcampId,
    })
      .populate("domain", "title")
      .populate("bootcamp", "name")
      .populate("teacher", "name")     // ✅ Fix: "mentor" → "teacher"
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "Assignments fetched successfully",
      data: assignments,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// update assignment
export const updatedAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacher: req.user._id,           // ✅ Fix: "mentor" → "teacher"
      bootcamp: req.user.bootcampId,
    });

    if (!assignment) {
      return res.status(404).send({
        success: false,
        message: "Assignment not found",
      });
    }

    Object.assign(assignment, req.body);
    await assignment.save();

    res.status(200).send({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// delete assignment
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacher: req.user._id,           // ✅ Fix: "mentor" → "teacher"
      bootcamp: req.user.bootcampId,
    });

    if (!assignment) {
      return res.status(404).send({
        success: false,
        message: "Assignment not found",
      });
    }

    await assignment.deleteOne();

    res.status(200).send({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// update deadline
export const updateDeadline = async (req, res) => {
  try {
    const { deadline } = req.body;

    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacher: req.user._id,           // ✅ Fix: "mentor" → "teacher"
      bootcamp: req.user.bootcampId,
    });

    if (!assignment) {
      return res.status(404).send({
        success: false,
        message: "Assignment not found",
      });
    }

    assignment.deadline = new Date(deadline);
    await assignment.save();

    res.status(200).send({
      success: true,
      message: "Deadline updated successfully",
      data: assignment,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// review submission
export const reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, feedback } = req.body;

    if (!status) {
      return res.status(400).send({
        success: false,
        message: "Status is required",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).send({
        success: false,
        message: "Status must be approved or rejected",
      });
    }

    const submission =
      await SubmitAssignment.findById(submissionId).populate("assignment");

    if (!submission) {
      return res.status(404).send({
        success: false,
        message: "Submission not found",
      });
    }

    // validate teacher owns the assignment
    if (
      submission.assignment.teacher.toString() !== req.user._id.toString() || // ✅ Fix: "mentor" → "teacher"
      submission.assignment.bootcamp.toString() !==
        req.user.bootcampId.toString()
    ) {
      return res.status(403).send({
        success: false,
        message: "You are not authorized to review this submission",
      });
    }

    submission.status = status;
    submission.feedback = feedback;
    submission.reviewedAt = new Date();
    await submission.save();

    res.status(200).send({
      success: true,
      message: `Submission ${status} successfully`,
      submission,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

// get submissions for an assignment
export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      teacher: req.user._id,           // ✅ Fix: "mentor" → "teacher"
      bootcamp: req.user.bootcampId,
    });

    if (!assignment) {
      return res.status(404).send({
        success: false,
        message: "Assignment not found or you are not authorized",
      });
    }

    const submissions = await SubmitAssignment.find({
      assignment: assignmentId,
    }).populate("student", "name email");

    res.status(200).send({
      success: true,
      submissions,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};