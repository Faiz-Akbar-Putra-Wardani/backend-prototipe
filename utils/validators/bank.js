const { body } = require('express-validator');

const validateBank = [
    body('account_holder')
        .notEmpty()
        .withMessage('Nama pemilik rekening harus diisi')
        .trim(),
    body('bank_name')
        .notEmpty()
        .withMessage('Nama bank harus diisi')
        .trim(),
    body('account_number')
        .notEmpty()
        .withMessage('Nomor rekening harus diisi')
        .trim()
        .matches(/^[0-9-]+$/)
        .withMessage('Nomor rekening hanya boleh berisi angka dan tanda hubung'),
];

module.exports = { validateBank };
