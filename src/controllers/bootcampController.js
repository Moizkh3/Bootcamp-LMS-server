import Bootcamp from "../models/bootcampModel.js";

export async function createBootcamp(req, res) {
    try {
        let { name, description, startDate, endDate, domains, teachers } = req.body;

        if (!domains || !name || !startDate || !endDate || !teachers) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing'
            })
        }

        if (startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be greater than end date'
            })
        }

        if (domains.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Domain is required'
            })
        }

        if (teachers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Teacher is required'
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
        res.status(200).json({
            success: true,
            message: 'Bootcamps fetched successfully',
            data: bootcamps
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
        let bootcamp = await Bootcamp.findById(req.params.id);
        if (!bootcamp) {
            return res.status(404).json({
                success: false,
                message: 'Bootcamp not found'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Bootcamp fetched successfully',
            data: bootcamp
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
        let { name, description, startDate, endDate, status } = req.body;

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