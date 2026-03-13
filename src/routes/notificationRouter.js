import express from "express";
import { getNotifications, getMobileNotifications, markNotificationsRead, markSingleNotificationRead } from "../controllers/notificationController.js";
import checkAuth from "../middlewares/checkAuth.js";

const router = express.Router();

router.get("/", checkAuth, getNotifications);
router.get("/mobile", checkAuth, getMobileNotifications);
router.put("/mark-read", checkAuth, markNotificationsRead);
router.put("/:id/read", checkAuth, markSingleNotificationRead);

export default router;
