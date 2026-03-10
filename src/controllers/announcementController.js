import { Announcement } from "../models/announcementModel.js";

export const createAnnouncement = async (req, res) => {
    try {
        const { title, description, bootcampId, domainId } = req.body;

        if (!title || !description || !bootcampId) {
            return res.status(400).json({
                success: false,
                message: "Title, description, and bootcampId are required",
            });
        }

        const announcement = await Announcement.create({
            title,
            description,
            bootcampId,
            domainId,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            data: announcement,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getAnnouncements = async (req, res) => {
    try {
        const { bootcampId, domainId } = req.query;
        let filter = {};
        if (bootcampId) filter.bootcampId = bootcampId;
        if (domainId) filter.domainId = domainId;

        const announcements = await Announcement.find(filter)
            .populate("createdBy", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: announcements,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found",
            });
        }

        await announcement.deleteOne();
        res.status(200).json({
            success: true,
            message: "Announcement deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
