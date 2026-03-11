import express from "express";
import checkAuth from "../middlewares/checkAuth.js";
import checkTeacher from "../middlewares/checkTeacher.js";
import {
    createAssignment,
    deleteAssignment,
    getAssignments,
    getAssignmentSubmissions,
    reviewSubmission,
    updatedAssignment,
    updateDeadline
} from "../controllers/teacherAssignmentController.js";
import {
    getTeacherStats,
    getTeacherSubmissions,
    getSubmissionById
} from "../controllers/teacherDashboard.js";
import upload from "../config/multer.js";

const router = express.Router();

router.get("/stats", checkAuth, checkTeacher, getTeacherStats);
router.get("/get-submissions", checkAuth, checkTeacher, getTeacherSubmissions);
router.get("/get-submission/:id", checkAuth, checkTeacher, getSubmissionById);
router.post("/create-assignment", upload.single("document"), checkAuth, checkTeacher, createAssignment);
router.put("/update-assignment/:id", checkAuth, checkTeacher, updatedAssignment);
router.get("/get-assignments", checkAuth, checkTeacher, getAssignments);
router.delete("/delete-assignment/:id", checkAuth, checkTeacher, deleteAssignment);
router.put("/update-deadline/:id", checkAuth, checkTeacher, updateDeadline);
router.post("/review-submission/:submissionId", checkAuth, checkTeacher, reviewSubmission);
router.get("/get-assignment-submissions/:assignmentId", checkAuth, checkTeacher, getAssignmentSubmissions);

export default router;