const { validationResult } = require ("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
   
    return res.status(422).json({
      meta: {
        success: false,
        message: "Validation errors occurred",
      },
      errors: errors.array(),
    });
  }
  next();
};7. 

module.exports = handleValidationErrors;