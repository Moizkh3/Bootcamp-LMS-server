import express from "express";
import upload from "../config/multer.js";
import {
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
} from "../controllers/submissionController.js";

const router = express.Router();
// Wrapper for multer to catch busboy malformed header errors
const uploadSingleSafe = (req, res, next) => {
  const multerUpload = upload.single("referenceFile");
  multerUpload(req, res, (err) => {
    if (err) {
      if (err.message && err.message.includes("Malformed part header")) {
        // Ignore this specific Postman error, and pretend no file was attached
        return next();
      }
      return res
        .status(400)
        .json({ success: false, message: "File upload error: " + err.message });
    }
    next();
  });
};

router.post(
  "/submit-assignment",
  // checkStudent,
  uploadSingleSafe,
  createSubmission,
);

router.get("/", getAllSubmissions);
router.get("/:id", getSubmissionById);
router.put("/:id", uploadSingleSafe, updateSubmission);
router.delete("/:id", deleteSubmission);

export default router;
