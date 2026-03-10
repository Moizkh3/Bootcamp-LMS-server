function checkAdminOrTeacher(req, res, next) {
    const role = req.user?.role;
    if (role === 'admin' || role === 'teacher') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Only admin or teacher can perform this action.'
        });
    }
}

export default checkAdminOrTeacher;
