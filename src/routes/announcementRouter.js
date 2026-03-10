import express from "express";
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from "../controllers/announcementController.js";
import checkAuth from "../middlewares/checkAuth.js";
import checkAdmin from "../middlewares/checkAdmin.js";

const router = express.Router();

router.post("/create", checkAuth, checkAdmin, createAnnouncement);
router.get("/all", checkAuth, getAnnouncements);
router.delete("/delete/:id", checkAuth, checkAdmin, deleteAnnouncement);

export default router;
