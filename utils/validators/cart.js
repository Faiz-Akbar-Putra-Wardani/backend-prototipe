const { body } = require("express-validator");

// untuk POST /carts
const validateCart = [
  body("product_id")
    .notEmpty()
    .withMessage("Product is required")
    .isInt(),

  body("qty")
    .notEmpty()
    .withMessage("Qty is required")
    .isInt({ min: 1 })
    .withMessage("Qty minimal 1"),
];

// untuk PUT /carts/:id
const validateUpdateCartQty = [
  body("qty")
    .notEmpty()
    .withMessage("Qty is required")
    .isInt({ min: 1 })
    .withMessage("Qty minimal 1"),
];

module.exports = {
  validateCart,
  validateUpdateCartQty,
};
