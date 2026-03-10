import express from "express";
import checkAuth from "../middlewares/checkAuth.js";
import checkAdmin from "../middlewares/checkAdmin.js";
import { createAssignment, deleteAssignment, getAssignments, getAssignmentSubmissions, reviewSubmission, updatedAssignment, updateDeadline } from "../controllers/teacherAssignmentController.js";
import upload from "../config/multer.js";
const router = express.Router();

router.post("/create-assignment",upload.single("document") ,checkAuth, checkAdmin, createAssignment)
router.put("/update-assignment/:id", checkAuth, checkAdmin, updatedAssignment)
router.get("/get-assignments", checkAuth, checkAdmin, getAssignments)
router.delete("/delete-assignment/:id", checkAuth, checkAdmin,  deleteAssignment)
router.put("/update-deadline/:id", checkAuth, checkAdmin, updateDeadline)
router.post("/review-submission/:submissionId", checkAuth, checkAdmin, reviewSubmission)
router.get("/get-assignment-submissions/:assignmentId", checkAuth, checkAdmin, getAssignmentSubmissions)


export default router;