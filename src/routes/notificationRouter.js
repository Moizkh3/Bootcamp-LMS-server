import express from "express";
import { getNotifications, markNotificationsRead } from "../controllers/notificationController.js";
import checkAuth from "../middlewares/checkAuth.js";

const router = express.Router();

router.get("/", checkAuth, getNotifications);
router.put("/mark-read", checkAuth, markNotificationsRead);

export default router;
