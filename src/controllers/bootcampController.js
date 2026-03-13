import Bootcamp from "../models/bootcampModel.js";
import User from "../models/user.js";
import Domain from "../models/domainSchema.js";
import Assignment from "../models/assignmentModel.js";
import mongoose from "mongoose";

export async function createBootcamp(req, res) {
    try {
        let { name, description, startDate, endDate, domains = [], teachers = [] } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing: name, startDate, and endDate are required'
            })
        }

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be greater than end date'
            })
        }


        let newbootcamp = new Bootcamp({
            name,
            description,
            startDate,
            endDate,
            domains,
            teachers
        });

        let savedBootcamp = await newbootcamp.save();

        res.status(201).json({
            success: true,
            message: 'Bootcamp created successfully',
            data: savedBootcamp
        })


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}

export async function getAllBootcamps(req, res) {
    try {

        let filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };



        let bootcamps = await Bootcamp.find(filter);

        // Get student and domain counts for each bootcamp
        const bootcampsWithCounts = await Promise.all(bootcamps.map(async (bootcamp) => {
            const studentCount = await User.countDocuments({
                role: 'student',
                studentBootcampId: bootcamp._id
            });
            const domainCount = bootcamp.domains?.length || 0;
            return {
                ...bootcamp.toObject(),
                studentCount,
                domainCount
            };
        }));

        res.status(200).json({
            success: true,
            message: 'Bootcamps fetched successfully',
            data: bootcampsWithCounts
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


export async function getBootcampById(req, res) {
    try {
        let bootcamp = await Bootcamp.findById(req.params.id).populate('domains');
        if (!bootcamp) {
            return res.status(404).json({
                success: false,
                message: 'Bootcamp not found'
            })
        }

        const studentCount = await User.countDocuments({
            role: 'student',
            studentBootcampId: req.params.id
        });

        // 1. Students By Domain Distribution
        const domains = bootcamp.domains || [];
        const studentsByDomain = await Promise.all(domains.map(async (domain) => {
            const count = await User.countDocuments({
                role: 'student',
                studentBootcampId: req.params.id,
                domainId: domain._id
            });
            return { name: domain.name, value: count };
        }));

        // 2. Assignment Stats
        const assignmentsCount = await Assignment.countDocuments({ bootcamp: req.params.id });
        const assignmentsByStatusRaw = await Assignment.aggregate([
            { $match: { bootcamp: new mongoose.Types.ObjectId(req.params.id) } },
            { $group: { _id: "$status", value: { $sum: 1 } } }
        ]);
        const assignmentsByStatus = assignmentsByStatusRaw.map(item => ({
            name: item._id,
            value: item.value
        }));

        const teachersCount = await User.countDocuments({
            role: 'teacher',
            teacherBootcampIds: req.params.id
        });

        res.status(200).json({
            success: true,
            message: 'Bootcamp fetched successfully',
            data: {
                ...bootcamp.toObject(),
                domains,
                studentCount,
                stats: {
                    studentsByDomain,
                    assignmentsByStatus,
                    assignmentsCount,
                    teachersCount
                }
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export async function deleteBootcamp(req, res) {
    try {
        let bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
        if (!bootcamp) {
            return res.status(404).json({
                success: false,
                message: 'Bootcamp not found'
            })

        }

        res.status(200).json({
            success: true,
            message: 'Bootcamp deleted successfully',
            data: bootcamp
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export async function editBootcamp(req, res) {
    try {
        let { name, description, startDate, endDate, status, teacherIds } = req.body;

        if (!name || !description || !startDate || !endDate || !status) {
            return res.status(400).json({
                success: false,
                message: "No updates required"
            })
        }

        let bootcamp = await Bootcamp.findById(req.params.id);


        if (!bootcamp) {
            return res.status(404).json({
                success: false,
                message: 'Bootcamp not found'
            })
        }

        if (name) bootcamp.name = name;
        if (description) bootcamp.description = description;
        if (startDate) bootcamp.startDate = startDate;
        if (endDate) bootcamp.endDate = endDate;
        if (status) bootcamp.status = status;

        let updatedBootcamp = await bootcamp.save();

        if (teacherIds && Array.isArray(teacherIds)) {
            // Remove this bootcamp from teachers who are no longer selected
            await User.updateMany(
                { role: 'teacher', teacherBootcampIds: bootcamp._id, _id: { $nin: teacherIds } },
                { $pull: { teacherBootcampIds: bootcamp._id } }
            );

            // Add this bootcamp to newly selected teachers
            await User.updateMany(
                { role: 'teacher', _id: { $in: teacherIds } },
                { $addToSet: { teacherBootcampIds: bootcamp._id } }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Bootcamp updated successfully',
            data: updatedBootcamp
        })


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}