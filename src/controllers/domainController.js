import Domain from '../models/domainSchema.js'
import User from '../models/user.js'
import Bootcamp from '../models/bootcampModel.js'
import mongoose from 'mongoose'
import Assignment from '../models/assignmentModel.js';

export async function addDomain(req, res) {
    try {
        let { name, description, bootcamp, status, type, mentorIds } = req.body;
        
        // Check if domain with this name already exists
        let existingDomain = await Domain.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        
        if (existingDomain) {
            // Update optional fields if provided
            if (description) existingDomain.description = description;
            if (status) existingDomain.status = status;
            if (type) existingDomain.type = type;
            
            await existingDomain.save();

            // Sync mentors if provided
            if (mentorIds && Array.isArray(mentorIds)) {
                // Add domainId to selected teachers
                await User.updateMany(
                    { _id: { $in: mentorIds } },
                    { $addToSet: { teacherDomainIds: existingDomain._id } }
                );
            }

            return res.status(200).json({
                success: true,
                message: 'Existing domain reused and updated',
                data: existingDomain
            });
        }

        let domain = new Domain({
            name,
            description,
            bootcamp: bootcamp || null,
            status,
            type,
            studentsCount: 0
        })

        let savedDomain = await domain.save();

        // Sync mentors if provided
        if (mentorIds && Array.isArray(mentorIds) && mentorIds.length > 0) {
            await User.updateMany(
                { _id: { $in: mentorIds } },
                { $addToSet: { teacherDomainIds: savedDomain._id } }
            );
        }

        res.status(201).json({
            success: true,
            message: 'Domain added successfully',
            data: savedDomain
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export async function deleteDomain(req, res) {
    try {
        const domainId = req.params.id;

        // Check if any assignments are linked to this domain
        const linkedAssignments = await Assignment.countDocuments({ domain: domainId });
        if (linkedAssignments > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete domain. It is linked to ${linkedAssignments} assignments.`
            });
        }

        // Check if any students are linked to this domain
        const linkedStudents = await User.countDocuments({ domainId: domainId });
        if (linkedStudents > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete domain. It is assigned to ${linkedStudents} students.`
            });
        }

        let domain = await Domain.findByIdAndDelete(domainId);

        if (!domain) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Domain deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function editDomain(req, res) {
    try {
        let domainId = req.params.id;
        let { name, description, bootcamp, status, type, mentorIds } = req.body;
        let domain = await Domain.findById(domainId);

        if (!domain) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        if (name) domain.name = name;
        if (description) domain.description = description;
        if (bootcamp) domain.bootcamp = bootcamp;
        if (status) domain.status = status;
        if (type) domain.type = type;

        let updatedDomain = await domain.save();

        // Sync mentors if provided
        if (mentorIds && Array.isArray(mentorIds)) {
            // 1. Remove this domain from all teachers first (to handle removals)
            // Or better, only remove from those NOT in the new list who previously had it.
            // Simplified: Remove from all then re-add to current list.
            
            await User.updateMany(
                { teacherDomainIds: domainId },
                { $pull: { teacherDomainIds: domainId } }
            );

            // 2. Add to the new list of mentors
            if (mentorIds.length > 0) {
                await User.updateMany(
                    { _id: { $in: mentorIds } },
                    { $addToSet: { teacherDomainIds: domainId } }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'Domain updated successfully',
            data: updatedDomain
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function getAllDomains(req, res) {
    try {
        let filters = {};
        let domains = await Domain.find(filters).lean();

        const domainsWithCounts = await Promise.all(domains.map(async (domain) => {
            // Migration check: if bootcamp is still a string name, try to fix it
            if (domain.bootcamp && !mongoose.Types.ObjectId.isValid(domain.bootcamp)) {
                const bc = await Bootcamp.findOne({ name: domain.bootcamp });
                if (bc) {
                    await Domain.findByIdAndUpdate(domain._id, { bootcamp: bc._id });
                    domain.bootcamp = bc._id.toString();
                }
            }

            const studentsCount = await User.countDocuments({
                role: 'student',
                studentStatus: { $in: ["enrolled", "active", "Active"] },
                domainId: domain._id
            });

            // Dynamically find mentor(s) assigned to this domain
            const mentors = await User.find({
                role: 'teacher',
                teacherDomainIds: domain._id
            }).select('name profileImage');

            let mentorName = domain.mentorName;
            let mentorAvatar = domain.mentorAvatar;

            if (mentors.length > 0) {
                // Use the first found mentor as the primary display
                mentorName = mentors[0].name;
                mentorAvatar = mentors[0].profileImage || '';
            }

            return { 
                ...domain, 
                studentsCount,
                mentorName,
                mentorAvatar,
                mentorIds: mentors.map(m => ({
                    _id: m._id,
                    name: m.name,
                    avatar: m.profileImage || ''
                }))
            };
        }));

        res.status(200).json({
            success: true,
            message: 'Domains fetched successfully',
            data: domainsWithCounts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


export async function getDomainById(req, res) {
    try {
        let domain = await Domain.findById(req.params.id);

        if (!domain) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const studentsCount = await User.countDocuments({
            role: 'student',
            studentStatus: { $in: ["enrolled", "active", "Active"] },
            domainId: domain._id
        });

        // Dynamically find mentor(s) assigned to this domain
        const mentors = await User.find({
            role: 'teacher',
            teacherDomainIds: domain._id
        }).select('name profileImage');

        let mentorName = domain.mentorName;
        let mentorAvatar = domain.mentorAvatar;

        if (mentors.length > 0) {
            mentorName = mentors[0].name;
            mentorAvatar = mentors[0].profileImage || '';
        }

        res.status(200).json({
            success: true,
            message: 'Domain fetched successfully',
            data: { 
                ...domain.toObject(), 
                studentsCount,
                mentorName,
                mentorAvatar,
                mentorIds: mentors.map(m => ({
                    _id: m._id,
                    name: m.name,
                    avatar: m.profileImage || ''
                }))
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}