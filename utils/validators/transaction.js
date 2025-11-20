//import express validator
const { body } = require('express-validator');

// Definisikan validasi untuk create transaction
const validateTransaction = [
    body('grand_total').notEmpty().withMessage('Grand Total is required'),
];

module.exports = { validateTransaction }