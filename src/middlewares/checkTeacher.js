function checkTeacher(req , res , next) {
    if (req.user.role === 'teacher') {
        next()
    } else {
        res.status(403).json({
            success: false,
            message: 'You are not authorized to perform this action'
        })  
    }
}