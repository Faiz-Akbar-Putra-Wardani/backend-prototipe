const { body } = require('express-validator');

const validateRepair = [
  // Customer ID - wajib
  body("customer_id")
    .notEmpty().withMessage("Customer wajib dipilih")
    .isInt({ gt: 0 }).withMessage("Customer ID harus berupa angka valid"),

  // Item Repair - wajib (ganti dari custom_item)
  body("item_repair")
    .notEmpty().withMessage("Item yang diperbaiki wajib diisi")
    .isString().withMessage("Item repair harus berupa teks")
    .trim()
    .isLength({ min: 3 }).withMessage("Item repair minimal 3 karakter"),

  // Start Date - wajib
  body("start_date")
    .notEmpty().withMessage("Tanggal mulai perbaikan wajib diisi")
    .isISO8601().withMessage("Format tanggal mulai tidak valid")
    .toDate(),

  // End Date - wajib dan harus setelah start_date
  body("end_date")
    .notEmpty().withMessage("Tanggal selesai perbaikan wajib diisi")
    .isISO8601().withMessage("Format tanggal selesai tidak valid")
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.start_date)) {
        throw new Error('Tanggal selesai harus setelah tanggal mulai');
      }
      return true;
    }),

  // Description - wajib
  body("description")
    .notEmpty().withMessage("Deskripsi perbaikan wajib diisi")
    .isString().withMessage("Deskripsi harus berupa teks")
    .trim(),
  // Component - opsional
  body("component")
    .optional({ checkFalsy: true })
    .isString().withMessage("Komponen harus berupa teks")
    .trim(),

  // PIC - wajib
  body("pic")
    .notEmpty().withMessage("PIC/Teknisi wajib diisi")
    .isString().withMessage("PIC harus berupa teks")
    .trim()
    .isLength({ min: 3 }).withMessage("Nama PIC minimal 3 karakter"),

  // DP - opsional
  body("dp")
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage("DP harus angka dan minimal 0")
    .custom((value, { req }) => {
      const repairCost = parseFloat(req.body.repair_cost || 0);
      if (value > repairCost) {
        throw new Error('DP tidak boleh melebihi total biaya perbaikan');
      }
      return true;
    }),

  // Repair Cost - wajib
  body("repair_cost")
    .notEmpty().withMessage("Biaya perbaikan wajib diisi")
    .isFloat({ gt: 0 }).withMessage("Biaya perbaikan harus angka dan lebih besar dari 0"),

  // Status - wajib
  body("status")
    .notEmpty().withMessage("Status wajib dipilih")
    .isIn(['process', 'completed', 'pending']).withMessage("Status harus: process, completed, atau pending"),
];

module.exports = { validateRepair };
