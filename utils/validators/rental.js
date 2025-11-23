const { body } = require('express-validator');

// Definisikan validasi untuk create transaction
const validateRental = [
    // body("customer_id")
    // .notEmpty().withMessage("Pelanggan wajib diisi"),

     body("start_date")
    .notEmpty().withMessage("start_date wajib diisi")
    .isISO8601().withMessage("start_date harus format tanggal yang valid"),

  body("end_date")
    .notEmpty().withMessage("end_date wajib diisi")
    .isISO8601().withMessage("end_date harus format tanggal yang valid")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error("end_date harus lebih besar dari start_date");
      }
      return true;
    }),

  body("rent_price")
    .notEmpty().withMessage("rent_price wajib diisi")
    .isFloat({ gt: 0 }).withMessage("rent_price harus angka dan lebih besar dari 0"),

  body("dp")
    .optional()
    .isFloat({ min: 0 }).withMessage("dp harus angka dan minimal 0"),
];

module.exports = { validateRental }