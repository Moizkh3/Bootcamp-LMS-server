import Domain from '../models/domainSchema.js'

export async function addDomain(req , res) {
    try {
        let { title , description  } = req.body;
        let domain = new Domain({
            title,
            description,
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

export async function editDomain() {
    try {
        let domainId = req.params.id;
        let { title , description  } = req.body;
        let domain = await Domain.findById(domainId);
        if (title) domain.title = title;
        if (description) domain.description = description;

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

export async function getAllDoamins(req , res) {
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


export async function getDomainById(req , res) {
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