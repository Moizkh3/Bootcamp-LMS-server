import Domain from '../models/domainSchema.js'
import User from '../models/user.js'
import Bootcamp from '../models/bootcampModel.js'
import mongoose from 'mongoose'
import Assignment from '../models/assignmentModel.js';

export async function addDomain(req, res) {
    try {
        let { name, description, bootcamp, status, type, mentorName, mentorAvatar } = req.body;
        
        // Check if domain with this name already exists
        let existingDomain = await Domain.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        
        if (existingDomain) {
            // Update optional fields if provided
            if (description) existingDomain.description = description;
            if (mentorName) existingDomain.mentorName = mentorName;
            if (mentorAvatar) existingDomain.mentorAvatar = mentorAvatar;
            
            // If a bootcamp was passed, we might want to ensure it's linked, 
            // but the new logic is that Bootcamps hold the array of domain IDs.
            // So we just return the existing domain.
            
            await existingDomain.save();

            return res.status(200).json({
                success: true,
                message: 'Existing domain reused',
                data: existingDomain
            });
        }

        let domain = new Domain({
            name,
            description,
            bootcamp: bootcamp || null,
            status,
            type,
            mentorName,
            mentorAvatar
        })

        let savedDomain = await domain.save();

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
        let { name, description, bootcamp, status, type, mentorName, mentorAvatar } = req.body;
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
        if (mentorName) domain.mentorName = mentorName;
        if (mentorAvatar) domain.mentorAvatar = mentorAvatar;

        let updatedDomain = await domain.save();

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
                mentorAvatar
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
                mentorAvatar
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}