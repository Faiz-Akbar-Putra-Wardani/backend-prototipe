const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.userRole) {
            return res.status(401).json({
                meta: { success: false, message: 'Tidak terautentikasi' }
            });
        }

        if (!allowedRoles.includes(req.userRole)) {
            return res.status(403).json({
                meta: { success: false, message: 'Akses ditolak. Role tidak sesuai.' }
            });
        }

        next();
    };
};

module.exports = roleGuard;
