const { body, check } = require('express-validator');

const validateCategory = [
  body('name')
    .notEmpty()
    .withMessage('Name is required'),

  check('image')
    .optional()
    .custom((value, { req }) => {
      if (req.method === 'POST' && !req.file) {
        throw new Error('Image is required');
      }
      return true;
    }),
];

module.exports = { validateCategory };
