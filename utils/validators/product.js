// Import express validator
const { body, check } = require("express-validator");

const prisma = require('../../prisma/client');

const validateProduct = [
  body("category_id").notEmpty().withMessage("Category is required"),
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  check("image").custom((value, { req }) => {
    if (req.method === 'POST' && !req.file) {
      throw new Error("Image is required");
    }
    return true;
  }),
  body("sell_price").notEmpty().withMessage("Sell Price is required"),
 body("rent_price")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Harga sewa harus >= 0"),
  body("stock").notEmpty().withMessage("Stock is required"),
];

module.exports = { validateProduct };