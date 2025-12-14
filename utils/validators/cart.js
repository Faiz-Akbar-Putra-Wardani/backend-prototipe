const { body } = require("express-validator");


const validateCart = [
  body("product_id")
    .notEmpty()
    .withMessage("Product is required")
    .isUUID() // ✅ UBAH: Dari isInt() ke isUUID()
    .withMessage("Product ID must be a valid UUID"), 

  body("qty")
    .notEmpty()
    .withMessage("Qty is required")
    .isInt({ min: 1 })
    .withMessage("Qty minimal 1"),
];


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
