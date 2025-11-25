// Import express validator
const { body, check } = require("express-validator");

const prisma = require('../../prisma/client');

const validateClient = [
  body("name").notEmpty().withMessage("name is required"),
  check("image").custom((value, { req }) => {
    if (req.method === 'POST' && !req.file) {
      throw new Error("Image is required");
    }
    return true;
  }),

];

module.exports = { validateClient };