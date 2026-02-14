const { body } = require('express-validator');
const prisma = require("../../prisma/client");

const validateCreateAdmin = [
    // ... (bagian create biarkan saja, sudah benar) ...
    body('name')
        .notEmpty().withMessage('Nama tidak boleh kosong')
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
    
    body('email')
        .notEmpty().withMessage('Email tidak boleh kosong')
        .isEmail().withMessage('Format email tidak valid')
        .custom(async (value) => {
            const existingUser = await prisma.user.findFirst({
                where: { email: value }
            });
            if (existingUser) {
                throw new Error('Email sudah terdaftar');
            }
            return true;
        }),
    
    body('password')
        .notEmpty().withMessage('Password tidak boleh kosong')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    
    body('role')
        .notEmpty().withMessage('Role tidak boleh kosong')
        .isIn(['admin', 'super_admin']).withMessage('Role harus admin atau super_admin'),
];

// PERBAIKAN DI SINI
const validateUpdateAdmin = [
    body('name')
        .optional()
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
    
    body('email')
        .optional()
        .isEmail().withMessage('Format email tidak valid')
        .custom(async (value, { req }) => {
            const existingUser = await prisma.user.findFirst({
                where: { 
                    email: value,
                    NOT: {
                        uuid: req.params.uuid 
                    }
                }
            });

            if (existingUser) {
                throw new Error('Email sudah digunakan oleh admin lain');
            }
            return true;
        }),
    
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    
    body('role')
        .optional()
        .isIn(['admin', 'super_admin']).withMessage('Role harus admin atau super_admin'),
];

module.exports = { 
    validateCreateAdmin, 
    validateUpdateAdmin 
};