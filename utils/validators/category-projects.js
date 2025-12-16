const { body, check } = require('express-validator');

const validateProjectCategory = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3 })
    .withMessage('Name minimal 3 karakter'),

  body('slug')
    .notEmpty()
    .withMessage('Slug is required')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug harus lowercase, tanpa spasi, gunakan dash (-) untuk pemisah'),

 
];

module.exports = { validateProjectCategory };