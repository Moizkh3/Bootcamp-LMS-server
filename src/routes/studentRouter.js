import express from "express";
import checkAuth from "../middlewares/checkAuth.js";
import checkAdminOrTeacher from "../middlewares/checkAdminOrTeacher.js";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  editStudent,
  deleteStudent,
} from "../controllers/studentController.js";

const studentRouter = express.Router();

// All student routes require authentication + admin or teacher role
studentRouter.use(checkAuth, checkAdminOrTeacher);

// POST   /student          → create a new student
studentRouter.post("/", createStudent);

// GET    /student          → get all students (teachers see their bootcamp only)
studentRouter.get("/", getAllStudents);

// GET    /student/:id      → get a single student by ID
studentRouter.get("/:id", getStudentById);

// PUT    /student/:id      → update a student's details
studentRouter.put("/:id", editStudent);

// DELETE /student/:id      → delete a student
studentRouter.delete("/:id", deleteStudent);

export default studentRouter;
