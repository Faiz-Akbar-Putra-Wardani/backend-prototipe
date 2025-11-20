
const { body } = require('express-validator');

const validateCart = [
    body('product_id').notEmpty().withMessage('Product is required'),
    body('qty').notEmpty().withMessage('Qty is required'),
];

module.exports = { validateCart }