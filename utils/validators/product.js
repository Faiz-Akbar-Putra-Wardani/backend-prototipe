// Import express validator
const { body, check } = require("express-validator");

const validateProduct = [
  body("category_id")
    .notEmpty().withMessage("Category is required")
    .isInt({ min: 1 }).withMessage("Category must be a valid number"),
  
  body("title")
    .notEmpty().withMessage("Title is required")
    .trim(),
  
  body("description")
    .notEmpty().withMessage("Description is required")
    .trim(),
  
  check("image").custom((value, { req }) => {
    if (req.method === 'POST' && !req.file) {
      throw new Error("Image is required");
    }
    return true;
  }),
  
  body("sell_price")
    .notEmpty().withMessage("Sell Price is required")
    .isFloat({ min: 0 }).withMessage("Sell price must be a positive number"),
  
  body("rent_price")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Rent price must be >= 0"),
  
  body("stock")
    .notEmpty().withMessage("Stock is required")
    .isInt({ min: 0 }).withMessage("Stock must be a positive number"),
];

module.exports = { validateProduct };
