async function checkRegistration(req , res , next) {
    let { role } = req.body;
    try {
        if (req.user.role === 'admin') {
            next();
        } else if (req.user.role === 'teacher' && role === 'student') {
            next();
        }

        res.status(403).json({
            success: false,
            message: 'You are not authorized to perform this action'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}