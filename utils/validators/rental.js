const { body } = require('express-validator');

const validateRental = [

  body("total_rent_price")
    .notEmpty().withMessage("total sewa wajib diisi")
    .isFloat({ gt: 0 }).withMessage("total sewa harus angka dan lebih besar dari 0"),

  body("dp")
    .optional()
    .isFloat({ min: 0 }).withMessage("dp harus angka dan minimal 0"),
];

module.exports = { validateRental }