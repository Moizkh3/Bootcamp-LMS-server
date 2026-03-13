import { Announcement } from "../models/announcementModel.js";
import SubmittedAssignment from "../models/submissionModel.js";
import { Notification } from "../models/notificationModel.js";
import User from "../models/user.js";
import mongoose from "mongoose";

export const getNotifications = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const notifications = [];

        // 1. Get Announcements (Common for Students and Teachers)
        const announcementQuery = {};
        if (user.role === 'student' && user.studentBootcampId) {
            announcementQuery.bootcampId = user.studentBootcampId;
        } else if (user.role === 'teacher' && user.teacherBootcampIds?.length > 0) {
            announcementQuery.bootcampId = { $in: user.teacherBootcampIds };
        }

        const announcements = await Announcement.find(announcementQuery)
            .sort({ createdAt: -1 })
            .limit(50) // Fetch a larger pool to aggregate
            .populate('createdBy', 'name')
            .populate('bootcampId', 'name');

        announcements.forEach(a => {
            notifications.push({
                id: a._id,
                type: 'announcement',
                title: 'New Announcement',
                message: a.title,
                sender: { name: a.createdBy?.name || 'System' },
                context: a.bootcampId?.name || 'General',
                time: a.createdAt.toISOString(),
                unread: new Date(a.createdAt).getTime() > new Date(user.lastNotificationCheck || 0).getTime()
            });
        });

        // 2. Role Specific Notifications
        if (user.role === 'student') {
            // Student gets notifications for grading
            const submissions = await SubmittedAssignment.find({ 
                student: user._id,
                status: { $in: ['graded', 're-submit'] }
            })
            .sort({ updatedAt: -1 })
            .limit(50)
            .populate({
                path: 'assignment',
                select: 'title bootcamp',
                populate: { path: 'bootcamp', select: 'name' }
            });

            submissions.forEach(s => {
                notifications.push({
                    id: s._id,
                    type: 'feedback',
                    title: s.status === 'graded' ? 'Assignment Graded' : 'Revision Requested',
                    message: `Your assignment "${s.assignment?.title}" has been reviewed.`,
                    sender: { name: 'Instructor' },
                    context: s.assignment?.bootcamp?.name || 'Academic',
                    time: s.updatedAt.toISOString(),
                    unread: new Date(s.updatedAt).getTime() > new Date(user.lastNotificationCheck || 0).getTime(),
                    grade: s.status === 'graded' ? `${s.grade}/100` : null
                });
            });
        } else if (user.role === 'teacher') {
            // Teacher gets notifications for new submissions to grade
            const pendingSubmissions = await SubmittedAssignment.find({
                status: 'submitted'
            })
            .populate({
                path: 'assignment',
                match: { bootcamp: { $in: user.teacherBootcampIds || [] } },
                select: 'title bootcamp',
                populate: { path: 'bootcamp', select: 'name' }
            })
            .populate('student', 'name')
            .sort({ createdAt: -1 })
            .limit(50);

            pendingSubmissions.filter(s => s.assignment).forEach(s => {
                notifications.push({
                    id: s._id,
                    type: 'submission',
                    title: 'New Submission',
                    message: `${s.student?.name} submitted "${s.assignment?.title}"`,
                    sender: { name: s.student?.name || 'Student' },
                    context: s.assignment?.bootcamp?.name || 'Bootcamp',
                    time: s.createdAt.toISOString(),
                    unread: new Date(s.createdAt).getTime() > new Date(user.lastNotificationCheck || 0).getTime()
                });
            });
        } else if (user.role === 'admin') {
            // Admin gets notifications for EVERYTHING new
            const allNewSubmissions = await SubmittedAssignment.find({
                status: 'submitted'
            })
            .populate({
                path: 'assignment',
                select: 'title bootcamp',
                populate: { path: 'bootcamp', select: 'name' }
            })
            .populate('student', 'name')
            .sort({ createdAt: -1 })
            .limit(50);

            allNewSubmissions.forEach(s => {
                notifications.push({
                    id: s._id,
                    type: 'submission',
                    title: 'New Global Submission',
                    message: `${s.student?.name} submitted "${s.assignment?.title}"`,
                    sender: { name: s.student?.name || 'Student' },
                    context: s.assignment?.bootcamp?.name || 'System',
                    time: s.createdAt.toISOString(),
                    unread: new Date(s.createdAt).getTime() > new Date(user.lastNotificationCheck || 0).getTime()
                });
            });
        }

        // Sort all by time
        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        // Manual Pagination for aggregated results
        const totalItems = notifications.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginatedData = notifications.slice((page - 1) * limit, page * limit);

        res.status(200).json({
            success: true,
            data: paginatedData,
            unreadCount: notifications.filter(n => n.unread).length,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            },
            serverTime: new Date()
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMobileNotifications = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        const query = {
            $or: [
                { userId: user._id },
                { bootcampId: user.studentBootcampId },
            ],
        };

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markNotificationsRead = async (req, res) => {
    try {
        const user = req.user;

        await User.findByIdAndUpdate(user._id, {
            lastNotificationCheck: new Date()
        });

        await Notification.updateMany(
            {
                $or: [
                    { userId: user._id },
                    { bootcampId: user.studentBootcampId },
                ],
                isRead: false,
            },
            { isRead: true }
        );

        res.status(200).json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markSingleNotificationRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
