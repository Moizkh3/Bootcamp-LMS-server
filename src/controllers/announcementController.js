import mongoose from "mongoose";
import { Announcement } from "../models/announcementModel.js";

export const createAnnouncement = async (req, res) => {
    try {
        const { title, description, bootcampId, domainId } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required",
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
        console.log(`GET_ANNOUNCEMENTS: bootcampId=${bootcampId}, domainId=${domainId}`);
        let filter = {};
        
        if (bootcampId && mongoose.Types.ObjectId.isValid(bootcampId)) {
            // Include both global announcements AND bootcamp-specific ones
            filter.$or = [
                { bootcampId: new mongoose.Types.ObjectId(bootcampId) },
                { bootcampId: null },
                { bootcampId: { $exists: false } }
            ];
        }
        
        if (domainId && domainId !== 'all' && domainId !== 'undefined' && mongoose.Types.ObjectId.isValid(domainId)) {
            // Further narrow down OR keep it broad if domain is 'all'
            // For students, we want them to see (Global) OR (their Bootcamp) AND (Global Domain OR their Domain)
            // But usually $or logic is simpler: (Global) OR (My Bootcamp + My Domain)
            
            // Refined logic:
            // 1. If no bootcampId and no domainId -> Global
            // 2. If bootcampId and no domainId -> Bootcamp Wide
            // 3. If bootcampId and domainId -> Domain specific in Bootcamp
            
            // To make it easy: Filter where (bootcampId matches OR is global) AND (domainId matches OR is global)
            const bootcampFilter = { $or: [{ bootcampId: new mongoose.Types.ObjectId(bootcampId) }, { bootcampId: null }, { bootcampId: { $exists: false } }] };
            const domainFilter = { $or: [{ domainId: new mongoose.Types.ObjectId(domainId) }, { domainId: null }, { domainId: { $exists: false } }] };
            filter = { $and: [bootcampFilter, domainFilter] };
        }

        console.log("ANNOUNCEMENT_FILTER:", JSON.stringify(filter));
        const announcements = await Announcement.find(filter)
            .populate("createdBy", "name")
            .sort({ createdAt: -1 });
        console.log(`ANNOUNCEMENTS_FOUND: ${announcements.length}`);

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
