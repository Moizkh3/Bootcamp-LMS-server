import Submission from "../models/submissionModel.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const createSubmission = async (req, res) => {
  try {
    let fileUrl = "";

    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "bootcamp-submissions",
      });

      fileUrl = result.secure_url;

      // Delete local file
      fs.unlinkSync(req.file.path);
    }

    const submission = await Submission.create({
      assignment: req.body.assignment,
      student: req.user._id,
      frontendGithubUrl: req.body.frontendGithubUrl,
      backendGithubUrl: req.body.backendGithubUrl,
      deployedUrl: req.body.deployedUrl,
      behanceUrl: req.body.behanceUrl,
      figmaUrl: req.body.figmaUrl,
      note: req.body.note,
      referenceFile: fileUrl,
    });

    res.status(201).json({
      success: true,
      message: "Submission created successfully",
      submission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all submissions with real pagination
export const getAllSubmissions = async (req, res) => {
  try {
    const { student, assignment, bootcamp, page = 1, limit = 10 } = req.query;
    
    // Build filter
    let filter = {};
    if (student) filter.student = student;
    if (assignment) filter.assignment = assignment;

    // Handle bootcamp filter (requires population first if done client-side, 
    // but better to handle via assignment sub-query if possible)
    if (bootcamp) {
      // Find assignments belonging to this bootcamp first
      const Assignment = mongoose.model('Assignment');
      const assignmentsInBootcamp = await Assignment.find({ bootcamp }).select('_id');
      filter.assignment = { $in: assignmentsInBootcamp.map(a => a._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Run count and find in parallel
    const [submissions, totalSubmissions] = await Promise.all([
      Submission.find(filter)
        .populate("student", "name email rollNo")
        .populate("assignment", "title description deadline documentUrl bootcamp")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .exec(),
      Submission.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      submissions,
      pagination: {
        totalSubmissions,
        totalPages: Math.ceil(totalSubmissions / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single submission by ID
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("student", "name email rollNo")
      .populate(
        "assignment",
        "title description deadline documentUrl bootcamp",
      );

    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }

    res.status(200).json({
      success: true,
      submission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}; // Update submission
export const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    let fileUrl = "";

    const submission = await Submission.findById(id);
    if (!submission) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "bootcamp-submissions",
      });
      fileUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const updateData = {
      ...req.body,
    };
    if (fileUrl) {
      updateData.referenceFile = fileUrl;
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    )
      .populate("student", "name email rollNo")
      .populate(
        "assignment",
        "title description deadline documentUrl bootcamp",
      );

    res.status(200).json({
      success: true,
      message: "Submission updated successfully",
      submission: updatedSubmission,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete submission
export const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res
        .status(404)
        .json({ success: false, message: "Submission not found" });
    }
    res.status(200).json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
