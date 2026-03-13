import Assignment from "../models/assignmentModel.js";
import SubmitAssignment from "../models/submissionModel.js";
import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// create assignment
export const createAssignment = async (req, res) => {
  try {
    const { title, description, deadline, bootcamp, domain, requiredLinks, module } = req.body;

    if (!title || !description || !deadline || !bootcamp || !domain) {
      return res.status(400).send({
        success: false,
        message: "All required fields are required",
      });
    }

    if (!req.user.teacherBootcampIds || req.user.teacherBootcampIds.length === 0) {
      return res.status(403).send({
        success: false,
        message: "You are not assigned to any bootcamp",
      });
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).send({
        success: false,
        message: "Deadline cannot be in the past",
      });
    }

    let documentUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "bootcamp-submissions",
      });
      documentUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const assignment = await Assignment.create({
      title,
      description,
      documentUrl,
      domain: domain,
      bootcamp: bootcamp,
      deadline: deadlineDate,
      teacher: req.user._id,
      module: module || "N/A",
      requiredLinks: requiredLinks ? (Array.isArray(requiredLinks) ? requiredLinks : JSON.parse(requiredLinks)) : ["frontendGithubUrl"],
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

// get single assignment by ID
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("domain", "name")
      .populate("bootcamp", "name")
      .populate("teacher", "name");
 
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }
 
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// get assignments
export const getAssignments = async (req, res) => {
  try {
    const { bootcampId, teacherId } = req.query;
    let query = {};

    // If teacher, restrict to their assignments or their assigned bootcamps
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
      if (req.user.teacherBootcampIds && req.user.teacherBootcampIds.length > 0) {
        query.bootcamp = { $in: req.user.teacherBootcampIds };
      }
    }

    // If bootcampId is provided (from Admin or Teacher filter), apply it
    if (bootcampId) {
      query.bootcamp = bootcampId;
    }

    // If teacherId is provided (by Admin), filter by it
    if (teacherId && req.user.role === 'admin') {
        query.teacher = teacherId;
    }

    const assignments = await Assignment.find(query)
      .populate("domain", "name")
      .populate("bootcamp", "name")
      .populate("teacher", "name")
      .sort({ createdAt: -1 });

    // Enrich with submissionsCount and totalStudentsCount, plus submitted students array
    const enriched = await Promise.all(assignments.map(async (a) => {
      // Find all submissions for this assignment
      const allSubmissions = await SubmitAssignment.find({ assignment: a._id }).select('student');
      
      const submissionsCount = allSubmissions.length;
      const submittedStudents = allSubmissions.map(sub => sub.student.toString());
      
      const bootcampId = a.bootcamp?._id || a.bootcamp;
      const totalStudentsCount = bootcampId ? await User.countDocuments({
        role: "student",
        studentBootcampId: bootcampId,
        studentStatus: "enrolled"
      }) : 0;
      
      const isSubmit = submittedStudents.includes(req.user._id.toString());

      return {
        ...a.toObject(),
        submissionsCount,
        totalStudentsCount,
        submittedStudents,
        isSubmit
      };
    }));

    res.status(200).send({
      success: true,
      message: "Assignments fetched successfully",
      data: enriched,
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
      teacher: req.user._id,
      bootcamp: { $in: req.user.teacherBootcampIds || [] },
    });

    if (!assignment) {
      return res.status(404).send({
        success: false,
        message: "Assignment not found",
      });
    }

    const { requiredLinks, deadline } = req.body;
    const updateData = { ...req.body };

    if (requiredLinks) {
      updateData.requiredLinks = typeof requiredLinks === 'string' ? JSON.parse(requiredLinks) : requiredLinks;
    }

    if (deadline) {
      updateData.deadline = new Date(deadline);
    }

    Object.assign(assignment, updateData);
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
    let query = { _id: req.params.id };

    if (req.user.role !== 'admin') {
      query.teacher = req.user._id;
      if (req.user.teacherBootcampIds && req.user.teacherBootcampIds.length > 0) {
          query.bootcamp = { $in: req.user.teacherBootcampIds };
      } else {
          query.bootcamp = { $exists: true }; // Dummy condition if no bootcamps to prevent unauthorized access
      }
    }

    const assignment = await Assignment.findOne(query);

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
      teacher: req.user._id,
      bootcamp: { $in: req.user.teacherBootcampIds || [] },
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
    const { status, feedback, grade } = req.body;

    if (!status) {
      return res.status(400).send({
        success: false,
        message: "Status is required",
      });
    }

    if (!["graded", "re-submit", "under-review"].includes(status)) {
      return res.status(400).send({
        success: false,
        message: "Status must be graded, re-submit, or under-review",
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

    // Allow review if the teacher is the owner OR if they belong to the same bootcamp
    const isOwner = submission.assignment.teacher.toString() === req.user._id.toString();
    const isInBootcamp = (req.user.teacherBootcampIds || []).some(id => id.toString() === submission.assignment.bootcamp.toString());

    if (!isOwner && !isInBootcamp) {
      return res.status(403).send({
        success: false,
        message: "You are not authorized to review this submission",
      });
    }

    submission.status = status;
    submission.feedback = feedback;
    submission.grade = grade;
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
      teacher: req.user._id,
      bootcamp: { $in: req.user.teacherBootcampIds || [] },
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

export const getStudentAssignments = async (req, res) => {
  try {
    const student = req.user;
    // Student ka bootcamp aur domain 
    if (!student.studentBootcampId) {
      return res.status(403).send({
        success: false,
        message: "You are not enrolled in any bootcamp",
      });
    }

    if (!student.domainId) {
      return res.status(403).send({
        success: false,
        message: "You are not assigned to any domain",
      });
    }

    const assignments = await Assignment.find({
      bootcamp: student.studentBootcampId,
      domain: student.domainId,
      status: "published", 
    })
      .populate("teacher", "name email")
      .populate("bootcamp", "name")
      .populate("domain", "name")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "Assignments fetched successfully",
      total: assignments.length,
      data: assignments,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};