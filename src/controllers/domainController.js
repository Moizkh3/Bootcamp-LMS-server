import Domain from '../models/domainSchema.js'

export async function addDomain(req, res) {
    try {
        let { name, description, bootcamp, status, type, mentorName, mentorAvatar } = req.body;
        let domain = new Domain({
            name,
            description,
            bootcamp,
            status,
            type,
            mentorName,
            mentorAvatar
        })

        let savedDomain = await domain.save();

        res.status(202).json({
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
        let domain = await Domain.findByIdAndDelete(req.params.id);

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

        let domains = await Domain.find(filters);

        res.status(200).json({
            success: true,
            message: 'Domains fetched successfully',
            data: domains
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

        res.status(200).json({
            success: true,
            message: 'Domain fetched successfully',
            data: domain
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}