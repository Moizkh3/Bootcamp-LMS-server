import express from "express";
import {
  submitProgress,
  updateProgress,
  getStudentProgress,
  getBootcampProgress,
  reviewStandup,
} from "../controllers/progressController.js";
import checkAuth from "../middlewares/checkAuth.js";
import checkTeacher from "../middlewares/checkTeacher.js";

const router = express.Router();

router.post("/submit", checkAuth, submitProgress);

router.put("/update/:id", checkAuth, updateProgress);

router.get("/my-progress", checkAuth, getStudentProgress);

router.get("/bootcamp/:bootcampId", checkAuth, getBootcampProgress);

router.put("/review/:id", checkAuth, checkTeacher, reviewStandup);

export default router;
