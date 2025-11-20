const { body } = require('express-validator');

const validateCustomer = [
    body('name_perusahaan').notEmpty().withMessage('Name is required'),
    body('no_telp').notEmpty().withMessage('Phone number is required'),
    body('address').notEmpty().withMessage('Address is required'),
];

module.exports = { validateCustomer };